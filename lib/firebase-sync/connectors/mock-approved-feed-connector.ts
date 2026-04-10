import { mockRawFeedListings } from "@/data/mockFeed/raw-listings";
import type { FeedFetchParams, ListingFeedConnector } from "@/lib/firebase-sync/connectors/feed-connector";
import type { RawFeedListingPayload } from "@/types/firebase-sync";

export class MockApprovedFeedConnector implements ListingFeedConnector {
  readonly sourceSystem = "approved-mls-ddf" as const;

  async fetchFull(): Promise<RawFeedListingPayload[]> {
    return mockRawFeedListings;
  }

  async fetchIncremental(params: FeedFetchParams): Promise<RawFeedListingPayload[]> {
    if (!params.since) {
      return mockRawFeedListings.slice(0, 2);
    }

    return mockRawFeedListings.filter((listing) => {
      const updatedAt = listing.sourceUpdatedAt ?? "";
      return updatedAt >= params.since!;
    });
  }
}

/**
 * Real connector integration note:
 * Replace this mock with a board-approved feed connector implementation.
 * Expected responsibilities:
 * - authenticated request signing
 * - pagination / retries
 * - incremental cursor handling
 * - mapping source keys for deterministic upserts
 */
