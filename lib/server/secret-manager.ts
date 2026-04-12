const SECRET_MANAGER_BASE = "https://secretmanager.googleapis.com/v1";
const METADATA_TOKEN_URL =
  "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token";

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

function getProjectId(): string | null {
  return (
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

async function getMetadataAccessToken(): Promise<string> {
  const response = await fetch(METADATA_TOKEN_URL, {
    method: "GET",
    headers: {
      "Metadata-Flavor": "Google"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Metadata token request failed (${response.status}).`);
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) {
    throw new Error("Metadata token response missing access_token.");
  }

  return payload.access_token;
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

async function loadServerSecretsOnce(): Promise<void> {
  if (secretsLoaded) return;
  if (shouldSkipSecretFetch()) {
    secretsLoaded = true;
    return;
  }

  const projectId = getProjectId();
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
    const accessToken = await getMetadataAccessToken();
    let loadedCount = 0;

    for (const key of missingKeys) {
      const secretValue = await readSecretValue(projectId, key, accessToken);
      if (secretValue == null || secretValue.trim() === "") continue;
      process.env[key] = secretValue.trim();
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

