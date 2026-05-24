import { NextResponse } from "next/server";
import { sendLeadNotification } from "@/lib/email";
import { upsertContactFromLead } from "@/lib/leads/contacts-store";
import { storeLeadSubmission, updateLeadEmailDeliveryStatus } from "@/lib/leads/store";
import { validateLeadInput } from "@/lib/leads/validation";
import { ensureServerSecretsLoaded } from "@/lib/server/secret-manager";
import { getDefaultSiteSettings } from "@/lib/settings/site-settings";
import type { LeadSubmissionInput } from "@/types/lead";

export async function POST(request: Request) {
  await ensureServerSecretsLoaded();
  const defaultSettings = getDefaultSiteSettings();

  try {
    const payload = (await request.json()) as LeadSubmissionInput;
    const errors = validateLeadInput(payload);

    if (errors.length > 0) {
      console.warn("[leads] Validation failed", { errorsCount: errors.length });
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    }

    const normalizedPayload: LeadSubmissionInput = {
      ...payload,
      formType: payload.formType ?? "showing",
      status: payload.status ?? "pending",
      userEmail: payload.userEmail ?? payload.email,
      userName: payload.userName ?? payload.fullName
    };

    const record = await storeLeadSubmission(normalizedPayload);
    try {
      await upsertContactFromLead(record);
    } catch (contactsError) {
      console.error("[contacts] Failed to upsert profile from lead", {
        leadId: record.id,
        error: contactsError
      });
    }

    try {
      const emailResult = await sendLeadNotification(record);
      const emailDeliveryStatus = emailResult.mode === "live" ? "sent" : "mock";

      await updateLeadEmailDeliveryStatus(record.id, {
        emailDeliveryStatus,
        emailRecipientUsed: emailResult.recipientUsed,
        subjectUsed: emailResult.subjectUsed,
        emailProviderUsed: emailResult.provider,
        emailMode: emailResult.mode
      });

      console.info("[leads] Submission processed", {
        leadId: record.id,
        emailMode: emailResult.mode,
        provider: emailResult.provider,
        emailDeliveryStatus
      });
    } catch (emailError) {
      await updateLeadEmailDeliveryStatus(record.id, {
        emailDeliveryStatus: "failed",
        emailRecipientUsed: "",
        subjectUsed: defaultSettings.leadEmailSubject,
        emailProviderUsed: "unknown",
        emailMode: "live",
        emailError: emailError instanceof Error ? emailError.message : "Unknown email error"
      });

      console.error("[leads] Submission saved but email send failed", {
        leadId: record.id,
        error: emailError
      });
    }

    return NextResponse.json(
      {
        success: true,
        id: record.id,
        message:
          "Your request was received successfully. Yan will review it and follow up with you soon."
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[leads] Submission failed", error);
    return NextResponse.json(
      { error: "We could not submit your request right now. Please try again in a moment." },
      { status: 500 }
    );
  }
}
