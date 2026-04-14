import { NextResponse } from "next/server";
import { upsertContactFromLead } from "@/lib/leads/contacts-store";
import { storeLeadSubmission } from "@/lib/leads/store";
import { validateLeadInput } from "@/lib/leads/validation";
import { ensureServerSecretsLoaded } from "@/lib/server/secret-manager";
import type { LeadSubmissionInput } from "@/types/lead";

export async function POST(request: Request) {
  await ensureServerSecretsLoaded();

  try {
    const payload = (await request.json()) as LeadSubmissionInput;
    const errors = validateLeadInput(payload);

    if (errors.length > 0) {
      console.warn("[leads] Validation failed", { errorsCount: errors.length });
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    }

    const record = await storeLeadSubmission(payload);
    try {
      await upsertContactFromLead(record);
    } catch (contactsError) {
      console.error("[contacts] Failed to upsert profile from lead", {
        leadId: record.id,
        error: contactsError
      });
    }

    console.info("[leads] Submission saved. Email will be handled by Firestore trigger.", {
      leadId: record.id
    });

    return NextResponse.json(
      {
        success: true,
        id: record.id,
        message: "Your request was received successfully."
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
