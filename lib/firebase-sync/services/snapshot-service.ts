import { randomUUID } from "node:crypto";
import type { FirestoreSyncRepository } from "@/lib/firebase-sync/firestore/repository";
import type { ListingFirestoreDocument, ListingSnapshotDocument } from "@/types/firebase-sync";

const SNAPSHOT_FIELDS: Array<keyof ListingFirestoreDocument> = ["price", "status", "publicRemarks", "isVisible", "hiddenReason"];

export async function maybeWriteListingSnapshot(params: {
  repository: FirestoreSyncRepository;
  before: ListingFirestoreDocument | null;
  after: ListingFirestoreDocument;
  nowIso: string;
}): Promise<boolean> {
  if (!params.before) {
    const snapshot: ListingSnapshotDocument = {
      snapshotId: randomUUID(),
      listingId: params.after.listingId,
      sourceListingKey: params.after.sourceListingKey,
      capturedAt: params.nowIso,
      changedFields: ["created"],
      before: null,
      after: {
        price: params.after.price,
        status: params.after.status,
        publicRemarks: params.after.publicRemarks,
        isVisible: params.after.isVisible,
        hiddenReason: params.after.hiddenReason
      },
      reason: "created"
    };

    await params.repository.writeListingSnapshot(snapshot);
    return true;
  }

  const changedFields = SNAPSHOT_FIELDS.filter((field) => params.before![field] !== params.after[field]).map(String);
  if (changedFields.length === 0) return false;

  const snapshot: ListingSnapshotDocument = {
    snapshotId: randomUUID(),
    listingId: params.after.listingId,
    sourceListingKey: params.after.sourceListingKey,
    capturedAt: params.nowIso,
    changedFields,
    before: pickTrackedFields(params.before),
    after: pickTrackedFields(params.after),
    reason: mapSnapshotReason(changedFields)
  };

  await params.repository.writeListingSnapshot(snapshot);
  return true;
}

function mapSnapshotReason(changedFields: string[]): ListingSnapshotDocument["reason"] {
  if (changedFields.includes("isVisible") || changedFields.includes("hiddenReason")) return "hidden";
  if (changedFields.includes("price")) return "price_changed";
  if (changedFields.includes("status")) return "status_changed";
  if (changedFields.includes("publicRemarks")) return "remarks_changed";
  return "updated";
}

function pickTrackedFields(listing: ListingFirestoreDocument): Partial<ListingFirestoreDocument> {
  return {
    price: listing.price,
    status: listing.status,
    publicRemarks: listing.publicRemarks,
    isVisible: listing.isVisible,
    hiddenReason: listing.hiddenReason
  };
}
