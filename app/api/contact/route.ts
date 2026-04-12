import { NextResponse } from "next/server";
import { sendContactNotification } from "@/lib/email";
import { storeContactCommunication } from "@/lib/leads/communications-store";
import { storeContactSubmission, updateContactEmailDeliveryStatus } from "@/lib/leads/contact-store";
import { validateContactInput } from "@/lib/leads/validation";
import { ensureServerSecretsLoaded } from "@/lib/server/secret-manager";
import { getDefaultSiteSettings } from "@/lib/settings/site-settings";
import type { ContactSubmissionInput } from "@/types/contact";

export async function POST(request: Request) {
  await ensureServerSecretsLoaded();

  const defaultSettings = getDefaultSiteSettings();

  try {
    const payload = (await request.json()) as ContactSubmissionInput;
    const errors = validateContactInput(payload);

    if (errors.length > 0) {
      console.warn("[contact] Validation failed", { errorsCount: errors.length });
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    }

    const record = await storeContactSubmission(payload);
    await storeContactCommunication(record);

    try {
      const emailResult = await sendContactNotification(record);
      const emailDeliveryStatus = emailResult.mode === "live" ? "sent" : "mock";

      await updateContactEmailDeliveryStatus(record.id, {
        emailDeliveryStatus,
        emailRecipientUsed: emailResult.recipientUsed,
        subjectUsed: emailResult.subjectUsed,
        emailProviderUsed: emailResult.provider,
        emailMode: emailResult.mode
      });

      const message =
        emailResult.mode === "live"
          ? "Thank you! Your message has been sent successfully."
          : "Your message was received successfully.";

      console.info("[contact] Submission processed", {
        contactId: record.id,
        emailMode: emailResult.mode,
        provider: emailResult.provider,
        emailDeliveryStatus
      });

      return NextResponse.json({ success: true, id: record.id, message, emailMode: emailResult.mode }, { status: 201 });
    } catch (emailError) {
      await updateContactEmailDeliveryStatus(record.id, {
        emailDeliveryStatus: "failed",
        emailRecipientUsed: "",
        subjectUsed: defaultSettings.leadEmailSubject,
        emailProviderUsed: "unknown",
        emailMode: "live",
        emailError: emailError instanceof Error ? emailError.message : "Unknown email error"
      });

      console.error("[contact] Submission saved but email send failed", {
        contactId: record.id,
        error: emailError
      });

      return NextResponse.json(
        {
          success: true,
          id: record.id,
          message: "Your message was received successfully.",
          emailMode: "failed"
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("[contact] Submission failed", error);
    return NextResponse.json(
      { error: "We could not submit your message right now. Please try again in a moment." },
      { status: 500 }
    );
  }
}
