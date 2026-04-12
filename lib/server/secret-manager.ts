const SECRET_MANAGER_BASE = "https://secretmanager.googleapis.com/v1";

const DEFAULT_SECRET_ENV_KEYS = [
  "DDF_CLIENT_ID",
  "DDF_CLIENT_SECRET",
  "DDF_TOKEN_URL",
  "DDF_LISTINGS_URL",
  "DDF_REPLICATION_URL",
  "DDF_SCOPE",
  "MLS_CONNECTOR_KIND",
  "MLS_SYNC_ADMIN_TOKEN",
  "MLS_SCHEDULER_TOKEN",
  "RESEND_API_KEY",
  "FROM_EMAIL",
  "EMAIL_PROVIDER",
  "EMAIL_ENABLED"
] as const;

let secretsLoaded = false;
let inFlightLoad: Promise<void> | null = null;

export type ServerConfigSource = "env" | "secret" | "missing";

export interface ServerConfigResolution {
  key: string;
  hasValue: boolean;
  source: ServerConfigSource;
  projectId: string | null;
  error?: string;
}

function getEnvProjectId(): string | null {
  return (
    process.env.GCP_SECRETS_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    process.env.GCP_PROJECT ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    null
  );
}

function shouldSkipSecretFetch(): boolean {
  return process.env.SECRETS_AUTOLOAD_DISABLED === "true";
}

function parseCustomSecretList(): string[] {
  const raw = process.env.GCP_SECRET_NAMES;
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getSecretEnvKeys(): string[] {
  const customKeys = parseCustomSecretList();
  return customKeys.length > 0 ? customKeys : [...DEFAULT_SECRET_ENV_KEYS];
}

async function getGoogleAuthClient() {
  const { GoogleAuth } = await import("google-auth-library");
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"]
  });
  const client = await auth.getClient();
  return { auth, client };
}

async function getProjectId(): Promise<string | null> {
  const fromEnv = getEnvProjectId();
  if (fromEnv) return fromEnv;

  try {
    const { auth } = await getGoogleAuthClient();
    const detectedProjectId = await auth.getProjectId();
    return detectedProjectId || null;
  } catch {
    return null;
  }
}

async function getAccessToken(): Promise<string> {
  const { client } = await getGoogleAuthClient();
  const token = await client.getAccessToken();
  const accessToken = typeof token === "string" ? token : token?.token;

  if (!accessToken) {
    throw new Error("Could not obtain Google access token for Secret Manager.");
  }

  return accessToken;
}

async function readSecretValue(projectId: string, secretName: string, accessToken: string): Promise<string | null> {
  const encoded = encodeURIComponent(secretName);
  const url = `${SECRET_MANAGER_BASE}/projects/${projectId}/secrets/${encoded}/versions/latest:access`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (response.status === 404) return null;
  if (response.status === 403) {
    throw new Error(`Access denied for secret "${secretName}". Ensure Secret Accessor IAM is granted.`);
  }
  if (!response.ok) {
    throw new Error(`Secret read failed for "${secretName}" (${response.status}).`);
  }

  const json = (await response.json()) as {
    payload?: { data?: string };
  };
  const encodedData = json.payload?.data;
  if (!encodedData) return null;

  return Buffer.from(encodedData, "base64").toString("utf8");
}

async function readAndSetSecret(projectId: string, secretName: string, accessToken: string): Promise<string | null> {
  const secretValue = await readSecretValue(projectId, secretName, accessToken);
  if (secretValue == null || secretValue.trim() === "") return null;

  process.env[secretName] = secretValue.trim();
  return process.env[secretName] ?? null;
}

async function loadServerSecretsOnce(): Promise<void> {
  if (secretsLoaded) return;
  if (shouldSkipSecretFetch()) {
    secretsLoaded = true;
    return;
  }

  const projectId = await getProjectId();
  if (!projectId) {
    console.warn("[secrets] No project id found. Skipping Secret Manager autoload.");
    secretsLoaded = true;
    return;
  }

  const missingKeys = getSecretEnvKeys().filter((key) => {
    const value = process.env[key];
    return !value || !value.trim();
  });

  if (missingKeys.length === 0) {
    secretsLoaded = true;
    return;
  }

  try {
    const accessToken = await getAccessToken();
    let loadedCount = 0;

    for (const key of missingKeys) {
      const secretValue = await readAndSetSecret(projectId, key, accessToken);
      if (!secretValue) continue;
      loadedCount += 1;
    }

    console.info("[secrets] Secret Manager autoload completed", {
      projectId,
      requested: missingKeys.length,
      loaded: loadedCount
    });
  } catch (error) {
    console.warn("[secrets] Secret Manager autoload failed; continuing with existing env values.", error);
  } finally {
    secretsLoaded = true;
  }
}

export async function ensureServerSecretsLoaded(): Promise<void> {
  if (secretsLoaded) return;
  if (inFlightLoad) {
    await inFlightLoad;
    return;
  }

  inFlightLoad = loadServerSecretsOnce();
  try {
    await inFlightLoad;
  } finally {
    inFlightLoad = null;
  }
}

export async function getServerConfigValue(key: string): Promise<string | null> {
  const resolution = await resolveServerConfigValue(key);
  if (!resolution.hasValue) return null;
  const value = process.env[key];
  return value ? value.trim() : null;
}

export async function resolveServerConfigValue(key: string): Promise<ServerConfigResolution> {
  const existing = process.env[key];
  if (existing && existing.trim()) {
    return {
      key,
      hasValue: true,
      source: "env",
      projectId: await getProjectId()
    };
  }

  await ensureServerSecretsLoaded();
  const loaded = process.env[key];
  if (loaded && loaded.trim()) {
    return {
      key,
      hasValue: true,
      source: "secret",
      projectId: await getProjectId()
    };
  }

  const projectId = await getProjectId();
  if (!projectId) {
    return {
      key,
      hasValue: false,
      source: "missing",
      projectId: null,
      error: "No GCP project id available for Secret Manager lookup."
    };
  }

  try {
    const accessToken = await getAccessToken();
    const value = await readAndSetSecret(projectId, key, accessToken);
    if (value && value.trim()) {
      return {
        key,
        hasValue: true,
        source: "secret",
        projectId
      };
    }

    return {
      key,
      hasValue: false,
      source: "missing",
      projectId,
      error: `Secret "${key}" not found or empty.`
    };
  } catch (error) {
    console.warn("[secrets] On-demand secret read failed", { key, error });
    return {
      key,
      hasValue: false,
      source: "missing",
      projectId,
      error: error instanceof Error ? error.message : "Unknown secret read error."
    };
  }
}

export async function checkServerConfigValues(keys: string[]): Promise<{
  projectId: string | null;
  checkedAt: string;
  results: ServerConfigResolution[];
}> {
  const projectId = await getProjectId();
  const results: ServerConfigResolution[] = [];

  for (const key of keys) {
    results.push(await resolveServerConfigValue(key));
  }

  return {
    projectId,
    checkedAt: new Date().toISOString(),
    results
  };
}
