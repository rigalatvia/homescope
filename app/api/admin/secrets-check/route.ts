import { NextResponse } from "next/server";
import { checkServerConfigValues, getServerConfigValue } from "@/lib/server/secret-manager";

const DEFAULT_KEYS = [
  "MLS_SYNC_ADMIN_TOKEN",
  "MLS_SCHEDULER_TOKEN",
  "MLS_CONNECTOR_KIND",
  "DDF_CLIENT_ID",
  "DDF_CLIENT_SECRET",
  "DDF_TOKEN_URL",
  "DDF_LISTINGS_URL",
  "DDF_REPLICATION_URL",
  "DDF_SCOPE",
  "EMAIL_PROVIDER",
  "EMAIL_ENABLED",
  "RESEND_API_KEY",
  "FROM_EMAIL"
] as const;

interface SecretsCheckBody {
  keys?: string[];
}

export async function POST(request: Request) {
  const requestToken = request.headers.get("x-admin-sync-token");
  const adminToken = await getServerConfigValue("MLS_SYNC_ADMIN_TOKEN");

  if (adminToken && requestToken !== adminToken) {
    return NextResponse.json({ error: "Unauthorized diagnostics request." }, { status: 401 });
  }

  try {
    const body = ((await request.json()) as SecretsCheckBody) || {};
    const requestedKeys =
      Array.isArray(body.keys) && body.keys.length > 0
        ? body.keys.filter((key) => typeof key === "string" && key.trim()).map((key) => key.trim())
        : [...DEFAULT_KEYS];

    const diagnostics = await checkServerConfigValues(requestedKeys);

    const logs: string[] = [];
    logs.push(`[secrets-check] checkedAt=${diagnostics.checkedAt}`);
    logs.push(`[secrets-check] projectId=${diagnostics.projectId ?? "unknown"}`);
    if (!adminToken) {
      logs.push("[secrets-check] warning=MLS_SYNC_ADMIN_TOKEN is not resolved on server.");
    }

    for (const item of diagnostics.results) {
      const status = item.hasValue ? "OK" : "MISSING";
      const source = item.source.toUpperCase();
      const err = item.error ? ` | error=${item.error}` : "";
      logs.push(`[secrets-check] ${status} ${item.key} source=${source}${err}`);
    }

    return NextResponse.json(
      {
        success: true,
        diagnostics,
        logs
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[secrets-check] Failed", error);
    return NextResponse.json(
      {
        error: "Secrets diagnostics failed.",
        detail: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

