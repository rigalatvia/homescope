import { NextResponse } from "next/server";
import { importSeedSchoolsToFirestore } from "@/lib/schools/firestore-data";
import { getServerConfigValue } from "@/lib/server/secret-manager";

export const maxDuration = 300;

async function authorize(request: Request): Promise<NextResponse | null> {
  const adminToken = await getServerConfigValue("MLS_SYNC_ADMIN_TOKEN");
  const requestToken = request.headers.get("x-admin-sync-token");

  if (!adminToken) {
    return NextResponse.json({ error: "Admin sync token is not configured." }, { status: 503 });
  }

  if (requestToken !== adminToken) {
    return NextResponse.json({ error: "Unauthorized admin request." }, { status: 401 });
  }

  return null;
}

export async function POST(request: Request) {
  const authError = await authorize(request);
  if (authError) return authError;

  try {
    const result = await importSeedSchoolsToFirestore();

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("[admin][schools] Failed importing school seed data", error);
    return NextResponse.json(
      {
        error: "Could not import schools.",
        detail: error instanceof Error ? error.message : "Unknown import error"
      },
      { status: 500 }
    );
  }
}
