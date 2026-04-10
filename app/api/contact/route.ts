import { NextResponse } from "next/server";
import { sendContactNotification } from "@/lib/email";
import { storeContactSubmission } from "@/lib/leads/contact-store";
import { validateContactInput } from "@/lib/leads/validation";
import type { ContactSubmissionInput } from "@/types/contact";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ContactSubmissionInput;
    const errors = validateContactInput(payload);

    if (errors.length > 0) {
      console.warn("[contact] Validation failed", { errorsCount: errors.length });
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    }

    const record = await storeContactSubmission(payload);
    const emailResult = await sendContactNotification(record);

    const message =
      emailResult.mode === "mock"
        ? "Your message was captured successfully. Email delivery is currently in setup mode."
        : "Thank you! Your message has been sent successfully.";

    console.info("[contact] Submission processed", {
      contactId: record.id,
      emailMode: emailResult.mode,
      provider: emailResult.provider
    });

    return NextResponse.json({ success: true, id: record.id, message, emailMode: emailResult.mode }, { status: 201 });
  } catch (error) {
    console.error("[contact] Submission failed", error);
    return NextResponse.json(
      { error: "We could not submit your message right now. Please try again in a moment." },
      { status: 500 }
    );
  }
}
