import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { importCrmContactsFromCsv } from "@/lib/crm/contacts-store";

const MAX_CSV_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  const authError = await authorizeAdminRequest();
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please choose a CSV file to import." }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "The CSV file is empty." }, { status: 400 });
    }

    if (file.size > MAX_CSV_BYTES) {
      return NextResponse.json({ error: "CSV file is too large. Please keep it under 2 MB." }, { status: 400 });
    }

    const csvText = await file.text();
    const result = await importCrmContactsFromCsv(csvText);

    return NextResponse.json({
      success: true,
      importedCount: result.importedCount,
      contacts: result.contacts
    });
  } catch (error) {
    console.error("[admin][crm] Contact import failed", error);
    return NextResponse.json({ error: "Could not import contacts right now." }, { status: 500 });
  }
}
