import type { MLSConnectorHealth, MLSFetchOptions, MLSFetchedPage, RawMLSFeedListing } from "@/lib/mls/types";

export interface MLSFeedConnector {
  readonly connectorName: string;
  readonly sourceSystem: string;
  fetchAllListings(options?: MLSFetchOptions): Promise<RawMLSFeedListing[]>;
  fetchAllListingsPage?(options?: MLSFetchOptions): Promise<MLSFetchedPage<RawMLSFeedListing>>;
  fetchActiveListingsPage?(options?: MLSFetchOptions): Promise<MLSFetchedPage<RawMLSFeedListing>>;
  fetchNonActiveListingsPage?(options?: MLSFetchOptions): Promise<MLSFetchedPage<RawMLSFeedListing>>;
  fetchUpdatedListings(since?: Date, options?: MLSFetchOptions): Promise<RawMLSFeedListing[]>;
  healthCheck(): Promise<MLSConnectorHealth>;
}
