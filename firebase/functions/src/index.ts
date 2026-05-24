import { initializeApp } from "firebase-admin/app";
import { logger } from "firebase-functions/v2";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

initializeApp();

const LEADS_COLLECTION = "leads";

export const sendLeadEmailOnLeadCreated = onDocumentCreated(
  {
    document: `${LEADS_COLLECTION}/{leadId}`,
    region: "northamerica-northeast2",
    timeoutSeconds: 60
  },
  async (event) => {
    logger.info("[lead-email-trigger] Lead email notifications are handled by App Hosting /api/leads. Trigger is disabled.", {
      leadId: event.params.leadId
    });
  }
);
