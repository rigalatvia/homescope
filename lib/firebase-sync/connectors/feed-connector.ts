import type { FeedSourceSystem, RawFeedListingPayload } from "@/types/firebase-sync";

export interface FeedFetchParams {
  since?: string;
  limit?: number;
}

export interface ListingFeedConnector {
  readonly sourceSystem: FeedSourceSystem;
  fetchFull(): Promise<RawFeedListingPayload[]>;
  fetchIncremental(params: FeedFetchParams): Promise<RawFeedListingPayload[]>;
}
