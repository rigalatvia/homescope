import { mockMLSFeedListings } from "@/data/mockFeed/mls-listings";
import type { MLSConnectorHealth, MLSFetchOptions, MLSFetchedPage, RawMLSFeedListing } from "@/lib/mls/types";
import type { MLSFeedConnector } from "@/lib/mls/connectors/MLSFeedConnector";

export class MockMLSFeedConnector implements MLSFeedConnector {
  readonly connectorName = "mock";
  readonly sourceSystem = "approved-mls-ddf";

  async fetchAllListings(options?: MLSFetchOptions): Promise<RawMLSFeedListing[]> {
    return paginate(mockMLSFeedListings, options);
  }

  async fetchAllListingsPage(options?: MLSFetchOptions): Promise<MLSFetchedPage<RawMLSFeedListing>> {
    const items = paginate(mockMLSFeedListings, options);
    if (!options?.pageSize) {
      return { items, nextCursor: null };
    }

    const page = options.page ?? 1;
    const hasMore = page * options.pageSize < mockMLSFeedListings.length;
    return {
      items,
      nextCursor: hasMore ? String(page + 1) : null
    };
  }

  async fetchUpdatedListings(since?: Date, options?: MLSFetchOptions): Promise<RawMLSFeedListing[]> {
    if (!since) return paginate(mockMLSFeedListings.slice(0, 2), options);
    const sinceIso = since.toISOString();
    const filtered = mockMLSFeedListings.filter((item) => (item.sourceUpdatedAt ?? "") >= sinceIso);
    return paginate(filtered, options);
  }

  async fetchUpdatedListingsPage(since?: Date, options?: MLSFetchOptions): Promise<MLSFetchedPage<RawMLSFeedListing>> {
    const source = !since
      ? mockMLSFeedListings.slice(0, 2)
      : mockMLSFeedListings.filter((item) => (item.sourceUpdatedAt ?? "") >= since.toISOString());
    const items = paginate(source, options);
    if (!options?.pageSize) {
      return { items, nextCursor: null };
    }

    const page = options.page ?? 1;
    const hasMore = page * options.pageSize < source.length;
    return {
      items,
      nextCursor: hasMore ? String(page + 1) : null
    };
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
