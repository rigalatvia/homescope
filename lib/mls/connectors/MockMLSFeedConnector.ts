import { mockMLSFeedListings } from "@/data/mockFeed/mls-listings";
import type { MLSConnectorHealth, MLSFetchOptions, RawMLSFeedListing } from "@/lib/mls/types";
import type { MLSFeedConnector } from "@/lib/mls/connectors/MLSFeedConnector";

export class MockMLSFeedConnector implements MLSFeedConnector {
  readonly connectorName = "mock";
  readonly sourceSystem = "approved-mls-ddf";

  async fetchAllListings(options?: MLSFetchOptions): Promise<RawMLSFeedListing[]> {
    return paginate(mockMLSFeedListings, options);
  }

  async fetchUpdatedListings(since?: Date, options?: MLSFetchOptions): Promise<RawMLSFeedListing[]> {
    if (!since) return paginate(mockMLSFeedListings.slice(0, 2), options);
    const sinceIso = since.toISOString();
    const filtered = mockMLSFeedListings.filter((item) => (item.sourceUpdatedAt ?? "") >= sinceIso);
    return paginate(filtered, options);
  }

  async healthCheck(): Promise<MLSConnectorHealth> {
    return {
      ok: true,
      connector: "mock",
      message: "Mock connector healthy",
      checkedAt: new Date().toISOString()
    };
  }
}

function paginate(items: RawMLSFeedListing[], options?: MLSFetchOptions): RawMLSFeedListing[] {
  if (!options?.pageSize) return items;
  const page = options.page ?? 1;
  const start = (page - 1) * options.pageSize;
  return items.slice(start, start + options.pageSize);
}
