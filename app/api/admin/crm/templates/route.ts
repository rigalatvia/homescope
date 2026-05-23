import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { saveCrmTemplate } from "@/lib/crm/templates-store";
import type { CrmTemplateUpdateInput } from "@/types/crm";

function isValidTemplateKind(value: unknown): value is CrmTemplateUpdateInput["kind"] {
  return value === "birthday" || value === "holiday";
}

export async function PUT(request: Request) {
  const authError = await authorizeAdminRequest();
  if (authError) return authError;

  try {
    const body = (await request.json()) as Partial<CrmTemplateUpdateInput>;

    if (typeof body.id !== "string" || !body.id.trim()) {
      return NextResponse.json({ error: "Template id is required." }, { status: 400 });
    }

    if (!isValidTemplateKind(body.kind)) {
      return NextResponse.json({ error: "Template type is invalid." }, { status: 400 });
    }

    const template = await saveCrmTemplate({
      id: body.id.trim(),
      kind: body.kind,
      name: typeof body.name === "string" ? body.name : "",
      sendDate: typeof body.sendDate === "string" ? body.sendDate : "",
      subject: typeof body.subject === "string" ? body.subject : "",
      previewText: typeof body.previewText === "string" ? body.previewText : "",
      headline: typeof body.headline === "string" ? body.headline : "",
      body: typeof body.body === "string" ? body.body : "",
      signature: typeof body.signature === "string" ? body.signature : "",
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : "",
      imageStoragePath: typeof body.imageStoragePath === "string" ? body.imageStoragePath : "",
      imageStorageMode:
        body.imageStorageMode === "embedded" || body.imageStorageMode === "storage" || body.imageStorageMode === "none"
          ? body.imageStorageMode
          : "none",
      enabled: body.enabled === true
    });

    return NextResponse.json({
      success: true,
      template
    });
  } catch (error) {
    console.error("[admin][crm] Failed saving template", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save template." }, { status: 500 });
  }
}
