import { NextResponse } from "next/server";
import { sendLeadNotification } from "@/lib/email";
import { storeLeadSubmission } from "@/lib/leads/store";
import { validateLeadInput } from "@/lib/leads/validation";
import type { LeadSubmissionInput } from "@/types/lead";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as LeadSubmissionInput;
    const errors = validateLeadInput(payload);

    if (errors.length > 0) {
      console.warn("[leads] Validation failed", { errorsCount: errors.length });
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    }

    const record = await storeLeadSubmission(payload);
    const emailResult = await sendLeadNotification(record);

    const message =
      emailResult.mode === "mock"
        ? "Your request was captured successfully. Email delivery is currently in setup mode."
        : "Thank you! Your request has been sent successfully.";

    console.info("[leads] Submission processed", {
      leadId: record.id,
      emailMode: emailResult.mode,
      provider: emailResult.provider
    });

    return NextResponse.json({ success: true, id: record.id, message, emailMode: emailResult.mode }, { status: 201 });
  } catch (error) {
    console.error("[leads] Submission failed", error);
    return NextResponse.json(
      { error: "We could not submit your request right now. Please try again in a moment." },
      { status: 500 }
    );
  }
}
