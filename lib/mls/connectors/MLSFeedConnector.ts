import type { MLSConnectorHealth, MLSFetchOptions, RawMLSFeedListing } from "@/lib/mls/types";

export interface MLSFeedConnector {
  readonly connectorName: string;
  readonly sourceSystem: string;
  fetchAllListings(options?: MLSFetchOptions): Promise<RawMLSFeedListing[]>;
  fetchUpdatedListings(since?: Date, options?: MLSFetchOptions): Promise<RawMLSFeedListing[]>;
  healthCheck(): Promise<MLSConnectorHealth>;
}
