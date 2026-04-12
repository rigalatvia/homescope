import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";

const SETTINGS_COLLECTION = "settings";
const SITE_SETTINGS_DOCUMENT = "site";
const DEFAULT_LEAD_SUBJECT = "Homescope GTA LEAD";

export interface SiteSettings {
  leadRecipientEmail: string;
  leadEmailSubject: string;
}

function sanitizeEmail(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function sanitizeSubject(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function getDefaultSiteSettings(): SiteSettings {
  return {
    leadRecipientEmail: sanitizeEmail(process.env.LEADS_NOTIFICATION_EMAIL) || "notifications@homescopegta.local",
    leadEmailSubject: sanitizeSubject(process.env.LEAD_EMAIL_SUBJECT) || DEFAULT_LEAD_SUBJECT
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const fallback = getDefaultSiteSettings();

  try {
    const firestore = getFirebaseAdminFirestore();
    const snapshot = await firestore.collection(SETTINGS_COLLECTION).doc(SITE_SETTINGS_DOCUMENT).get();

    if (!snapshot.exists) {
      console.warn("[settings] settings/site missing. Using fallback email settings.");
      return fallback;
    }

    const data = snapshot.data() ?? {};
    return {
      leadRecipientEmail: sanitizeEmail(data.leadRecipientEmail) || fallback.leadRecipientEmail,
      leadEmailSubject: sanitizeSubject(data.leadEmailSubject) || fallback.leadEmailSubject
    };
  } catch (error) {
    console.error("[settings] Failed reading settings/site. Using fallback email settings.", error);
    return fallback;
  }
}

