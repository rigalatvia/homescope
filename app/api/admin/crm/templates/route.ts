import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createCrmTemplate, deleteCrmTemplate, saveCrmTemplate } from "@/lib/crm/templates-store";
import type { CrmTemplateCreateInput, CrmTemplateUpdateInput } from "@/types/crm";

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

export async function POST(request: Request) {
  const authError = await authorizeAdminRequest();
  if (authError) return authError;

  try {
    const body = (await request.json()) as Partial<CrmTemplateCreateInput>;

    if (!isValidTemplateKind(body.kind)) {
      return NextResponse.json({ error: "Template type is invalid." }, { status: 400 });
    }

    const template = await createCrmTemplate({
      kind: body.kind,
      name: typeof body.name === "string" ? body.name : ""
    });

    return NextResponse.json({
      success: true,
      template
    });
  } catch (error) {
    console.error("[admin][crm] Failed creating template", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create template." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authError = await authorizeAdminRequest();
  if (authError) return authError;

  try {
    const body = (await request.json()) as { id?: string };

    if (typeof body.id !== "string" || !body.id.trim()) {
      return NextResponse.json({ error: "Template id is required." }, { status: 400 });
    }

    await deleteCrmTemplate(body.id);

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error("[admin][crm] Failed deleting template", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not delete template." }, { status: 500 });
  }
}
