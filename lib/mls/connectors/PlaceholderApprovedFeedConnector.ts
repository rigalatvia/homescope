import type { MLSConnectorHealth, MLSFetchOptions, RawMLSFeedListing } from "@/lib/mls/types";
import type { MLSFeedConnector } from "@/lib/mls/connectors/MLSFeedConnector";

/**
 * Placeholder for approved MLS/CREA DDF/board feed integration.
 * Replace with real authenticated API logic once official payload specs are available.
 */
export class PlaceholderApprovedFeedConnector implements MLSFeedConnector {
  readonly connectorName = "approved-placeholder";
  readonly sourceSystem: string;

  constructor(sourceSystem = "approved-mls-ddf") {
    this.sourceSystem = sourceSystem;
  }

  async fetchAllListings(_options?: MLSFetchOptions): Promise<RawMLSFeedListing[]> {
    // TODO: Implement real full-feed fetch with official provider API credentials.
    return [];
  }

  async fetchUpdatedListings(_since?: Date, _options?: MLSFetchOptions): Promise<RawMLSFeedListing[]> {
    // TODO: Implement real incremental fetch using provider-supported updatedSince cursor/filter.
    return [];
  }

  async healthCheck(): Promise<MLSConnectorHealth> {
    return {
      ok: true,
      connector: "approved-placeholder",
      message: "Placeholder connector configured. Real integration TODO pending approved feed details.",
      checkedAt: new Date().toISOString()
    };
  }
}
