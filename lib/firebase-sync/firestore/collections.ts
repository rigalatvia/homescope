export const COLLECTIONS = {
  listings: "listings",
  listingSnapshots: "listingSnapshots",
  leads: "leads",
  contactMessages: "contactMessages",
  syncJobs: "syncJobs",
  settings: "settings"
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
