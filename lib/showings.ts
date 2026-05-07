import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type ShowingStatus = "pending" | "confirmed";

export interface UserShowing {
  id: string;
  listingId: string;
  listingMlsNumber: string;
  listingTitle: string;
  listingAddress: string;
  listingCity: string;
  listingUrl: string;
  listingImageUrl?: string;
  preferredDateTime: string;
  actualShowingDateTime?: string;
  status: ShowingStatus;
  createdAt: string;
  intent?: string;
  formType?: string;
}

export async function getUserShowings(userId: string): Promise<UserShowing[]> {
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(query(collection(db, "leads"), where("userId", "==", userId)));

  return snapshot.docs
    .map((showing) => {
      const data = showing.data() as Partial<UserShowing>;
      return {
        id: showing.id,
        listingId: valueOrEmpty(data.listingId),
        listingMlsNumber: valueOrEmpty(data.listingMlsNumber),
        listingTitle: valueOrEmpty(data.listingTitle),
        listingAddress: valueOrEmpty(data.listingAddress),
        listingCity: valueOrEmpty(data.listingCity),
        listingUrl: valueOrEmpty(data.listingUrl),
        listingImageUrl: typeof data.listingImageUrl === "string" ? data.listingImageUrl : undefined,
        preferredDateTime: valueOrEmpty(data.preferredDateTime),
        actualShowingDateTime: typeof data.actualShowingDateTime === "string" ? data.actualShowingDateTime : undefined,
        status: data.status === "confirmed" ? "confirmed" : "pending",
        createdAt: valueOrEmpty(data.createdAt),
        intent: typeof data.intent === "string" ? data.intent : undefined,
        formType: typeof data.formType === "string" ? data.formType : undefined
      } satisfies UserShowing;
    })
    .filter((showing) => showing.formType === "showing" || showing.intent === "showing" || showing.intent === "showing_request")
    .sort((left, right) => toMillis(right.createdAt || right.preferredDateTime) - toMillis(left.createdAt || left.preferredDateTime));
}

function valueOrEmpty(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toMillis(value: string): number {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}
