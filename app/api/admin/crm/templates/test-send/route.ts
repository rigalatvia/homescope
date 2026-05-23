import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { sendCrmTemplateTestEmail } from "@/lib/crm/email";
import { getCrmTemplateById } from "@/lib/crm/templates-store";

interface TestSendBody {
  templateId?: string;
  to?: string;
  recipientName?: string;
}

function sanitizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function sanitizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const authError = await authorizeAdminRequest();
  if (authError) return authError;

  try {
    const body = ((await request.json()) as TestSendBody) || {};
    const templateId = sanitizeText(body.templateId);
    const to = sanitizeEmail(body.to);
    const recipientName = sanitizeText(body.recipientName);

    if (!templateId) {
      return NextResponse.json({ error: "Template id is required." }, { status: 400 });
    }

    if (!to || !to.includes("@")) {
      return NextResponse.json({ error: "A valid recipient email is required." }, { status: 400 });
    }

    const template = await getCrmTemplateById(templateId);
    if (!template) {
      return NextResponse.json({ error: "Template not found." }, { status: 404 });
    }

    const result = await sendCrmTemplateTestEmail({
      template,
      to,
      recipientName
    });

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error("[admin][crm] Failed sending test template email", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send test email." },
      { status: 500 }
    );
  }
}
