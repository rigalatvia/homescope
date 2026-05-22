import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { saveCrmContact } from "@/lib/crm/contacts-store";
import type { CrmContactUpdateInput } from "@/types/crm";

function sanitizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function PUT(request: Request) {
  const authError = await authorizeAdminRequest();
  if (authError) return authError;

  try {
    const body = (await request.json()) as Partial<CrmContactUpdateInput>;

    if (typeof body.id !== "string" || !body.id.trim()) {
      return NextResponse.json({ error: "Contact id is required." }, { status: 400 });
    }

    const contact = await saveCrmContact({
      id: body.id.trim(),
      firstName: typeof body.firstName === "string" ? body.firstName : "",
      lastName: typeof body.lastName === "string" ? body.lastName : "",
      email: typeof body.email === "string" ? body.email : "",
      phone: typeof body.phone === "string" ? body.phone : "",
      birthdayRaw: typeof body.birthdayRaw === "string" ? body.birthdayRaw : "",
      notes: typeof body.notes === "string" ? body.notes : "",
      tags: sanitizeTags(body.tags),
      city: typeof body.city === "string" ? body.city : "",
      emailConsentStatus:
        body.emailConsentStatus === "subscribed" || body.emailConsentStatus === "unsubscribed"
          ? body.emailConsentStatus
          : "unknown",
      isActive: body.isActive !== false
    });

    return NextResponse.json({
      success: true,
      contact
    });
  } catch (error) {
    console.error("[admin][crm] Failed saving contact", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save contact." }, { status: 500 });
  }
}
