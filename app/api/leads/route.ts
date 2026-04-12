import { NextResponse } from "next/server";
import { sendLeadNotification } from "@/lib/email";
import { storeLeadSubmission, updateLeadEmailDeliveryStatus } from "@/lib/leads/store";
import { validateLeadInput } from "@/lib/leads/validation";
import { getDefaultSiteSettings } from "@/lib/settings/site-settings";
import type { LeadSubmissionInput } from "@/types/lead";

export async function POST(request: Request) {
  const defaultSettings = getDefaultSiteSettings();

  try {
    const payload = (await request.json()) as LeadSubmissionInput;
    const errors = validateLeadInput(payload);

    if (errors.length > 0) {
      console.warn("[leads] Validation failed", { errorsCount: errors.length });
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    }

    const record = await storeLeadSubmission(payload);
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

      const message =
        emailResult.mode === "live"
          ? "Thank you! Your request has been sent successfully."
          : "Your request was received successfully.";

      console.info("[leads] Submission processed", {
        leadId: record.id,
        emailMode: emailResult.mode,
        provider: emailResult.provider,
        emailDeliveryStatus
      });

      return NextResponse.json({ success: true, id: record.id, message, emailMode: emailResult.mode }, { status: 201 });
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

      return NextResponse.json(
        {
          error: "Your request was saved, but we could not send the notification email right now. Please try again shortly.",
          id: record.id,
          saved: true
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("[leads] Submission failed", error);
    return NextResponse.json(
      { error: "We could not submit your request right now. Please try again in a moment." },
      { status: 500 }
    );
  }
}
