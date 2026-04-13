import { logSyncInfo, logSyncWarn } from "@/lib/mls/utils/logger";
import { withRetry } from "@/lib/mls/utils/retry";
import type { MLSConnectorHealth, MLSFetchOptions, MLSListingMedia, RawMLSFeedListing } from "@/lib/mls/types";
import type { MLSFeedConnector } from "@/lib/mls/connectors/MLSFeedConnector";

type JsonObject = Record<string, unknown>;

interface DdfConfig {
  sourceSystem: string;
  tokenUrl: string;
  listingsUrl: string;
  replicationUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  requestTimeoutMs: number;
  pageSize: number;
  maxRetries: number;
  topParam: string;
  sinceFilterField: string;
  baseFilter: string | null;
}

export class DdfTrebFeedConnector implements MLSFeedConnector {
  readonly connectorName = "ddf-treb";
  readonly sourceSystem: string;
  private readonly config: DdfConfig;
  private accessToken: string | null = null;

  constructor() {
    this.config = {
      sourceSystem: process.env.MLS_SOURCE_SYSTEM || "toronto-board-ddf",
      tokenUrl: requiredEnv("DDF_TOKEN_URL"),
      listingsUrl: requiredEnv("DDF_LISTINGS_URL"),
      replicationUrl: process.env.DDF_REPLICATION_URL || `${requiredEnv("DDF_LISTINGS_URL").replace(/\/$/, "")}/PropertyReplication()`,
      clientId: requiredEnv("DDF_CLIENT_ID"),
      clientSecret: requiredEnv("DDF_CLIENT_SECRET"),
      scope: process.env.DDF_SCOPE || "DDFApi_Read",
      requestTimeoutMs: Number(process.env.DDF_REQUEST_TIMEOUT_MS || 60000),
      pageSize: Math.min(Number(process.env.DDF_PAGE_SIZE || process.env.MLS_PAGE_SIZE || 100), 100),
      maxRetries: Number(process.env.DDF_MAX_RETRIES || 3),
      topParam: process.env.DDF_TOP_PARAM || "$top",
      sinceFilterField: process.env.DDF_SINCE_FILTER_FIELD || "ModificationTimestamp",
      baseFilter: process.env.DDF_BASE_FILTER || buildDefaultResidentialFilter()
    };
    this.sourceSystem = this.config.sourceSystem;
  }

  async fetchAllListings(options?: MLSFetchOptions): Promise<RawMLSFeedListing[]> {
    const responseItems = await this.fetchPaginated(undefined, options);
    return responseItems.map((item, index) => this.mapDdfRecordToRawListing(item, index));
  }

  async fetchUpdatedListings(since?: Date, options?: MLSFetchOptions): Promise<RawMLSFeedListing[]> {
    const responseItems = await this.fetchPaginated(since, options);
    return responseItems.map((item, index) => this.mapDdfRecordToRawListing(item, index));
  }

  async healthCheck(): Promise<MLSConnectorHealth> {
    try {
      const rows = await this.fetchPaginated(undefined, { page: 1, pageSize: 1 });
      return {
        ok: true,
        connector: "ddf-treb",
        message: `DDF connector healthy. Sample rows fetched: ${rows.length}.`,
        checkedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        ok: false,
        connector: "ddf-treb",
        message: error instanceof Error ? error.message : "Health check failed",
        checkedAt: new Date().toISOString()
      };
    }
  }

  private async fetchPaginated(since?: Date, options?: MLSFetchOptions): Promise<JsonObject[]> {
    const rows: JsonObject[] = [];
    const limitPageSize = options?.pageSize ?? this.config.pageSize;
    const requestedPage = options?.page && options.page > 0 ? options.page : null;

    if (requestedPage != null) {
      const url = this.buildListingsUrl(limitPageSize, since, true, requestedPage);
      const payload = await this.fetchListingsPage(url, since);
      const items = extractListingsArray(payload);
      logSyncInfo("DDF page fetched", { requestedPage, count: items.length });
      return items;
    }

    let nextUrl: string | null = null;
    let isFirstPage = true;

    while (true) {
      const url = nextUrl || this.buildListingsUrl(limitPageSize, since, isFirstPage);
      const payload = await this.fetchListingsPage(url, since);
      const items = extractListingsArray(payload);
      rows.push(...items);
      isFirstPage = false;

      nextUrl = extractNextUrl(payload);
      if (!nextUrl) {
        if (items.length < limitPageSize) break;
        break;
      }

      if (items.length === 0) break;
    }

    logSyncInfo("DDF fetch completed", { fetched: rows.length });
    return rows;
  }

  private buildListingsUrl(pageSize: number, since?: Date, isFirstPage = true, page = 1): string {
    const baseUrl = since ? this.config.replicationUrl : this.config.listingsUrl;
    const url = new URL(baseUrl);
    url.searchParams.set(this.config.topParam, String(pageSize));
    const skip = Math.max(0, page - 1) * pageSize;
    if (skip > 0) {
      url.searchParams.set("$skip", String(skip));
    }
    const filters: string[] = [];
    if (this.config.baseFilter) {
      filters.push(this.config.baseFilter);
    }
    if (since && isFirstPage) {
      const iso = since.toISOString();
      filters.push(`${this.config.sinceFilterField} gt ${iso}`);
    }
    if (filters.length > 0) {
      url.searchParams.set("$filter", filters.map((part) => `(${part})`).join(" and "));
    }
    return url.toString();
  }

  private async fetchListingsPage(url: string, since?: Date): Promise<unknown> {
    const token = await this.getValidAccessToken();
    const attemptRequest = async (): Promise<unknown> => {
      const response = await this.fetchWithTimeout(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        this.accessToken = null;
        const refreshedToken = await this.getValidAccessToken();
        const retryResponse = await this.fetchWithTimeout(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${refreshedToken}`
          }
        });
        if (!retryResponse.ok) {
          throw new Error(`DDF listings request failed after token refresh (${retryResponse.status}).`);
        }
        return retryResponse.json();
      }

      if (!response.ok) {
        throw new Error(`DDF listings request failed (${response.status})${since ? " during incremental sync" : ""}.`);
      }
      return response.json();
    };

    return withRetry(attemptRequest, {
      retries: this.config.maxRetries,
      shouldRetry: (error) => shouldRetryDdfError(error)
    });
  }

  private async getValidAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;
    this.accessToken = await this.requestAccessToken();
    return this.accessToken;
  }

  private async requestAccessToken(): Promise<string> {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: this.config.scope
    });

    const response = await this.fetchWithTimeout(this.config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body: body.toString()
    });

    if (!response.ok) {
      throw new Error(`DDF token request failed (${response.status}).`);
    }

    const payload = (await response.json()) as JsonObject;
    const token = pickString(payload, ["access_token", "token", "jwt", "id_token"]);
    if (!token) {
      throw new Error("DDF token response did not include an access token.");
    }

    logSyncInfo("DDF token acquired", { provider: "ddf", sourceSystem: this.sourceSystem });
    return token;
  }

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    } finally {
      clearTimeout(timeout);
    }
  }

  private mapDdfRecordToRawListing(record: JsonObject, index: number): RawMLSFeedListing {
    const sourceListingKey =
      pickString(record, ["ListingKey", "listingKey", "Id", "id", "ListingId"]) || `${Date.now()}-${index}`;
    const leaseAmount = pickNumber(record, ["LeaseAmount", "LeasePrice"]);
    const leasePrice = pickNumber(record, ["LeasePrice"]);
    const totalActualRent = pickNumber(record, ["TotalActualRent"]);
    const leaseAmountFrequency = pickString(record, ["LeaseAmountFrequency"]);
    const leasePerUnit = pickString(record, ["LeasePerUnit"]);
    const existingLeaseType = pickString(record, ["ExistingLeaseType", "LeaseType"]);
    const listPrice = pickNumber(record, ["ListPrice", "Price"]);

    return {
      sourceSystem: this.sourceSystem,
      sourceListingKey,
      mlsNumber: pickString(record, ["MlsNumber", "MLSNumber", "ListingNumber", "ListingId", "Id"]),
      listAgentNationalAssociationId: pickString(record, ["ListAgentNationalAssociationId"]),
      propertyClass: pickString(record, [
        "PropertyClass",
        "PropertyClassName",
        "PropertyCategory",
        "PropertyTypeGroup",
        "PropertyTypeDetail",
        "PropertyUse",
        "OwnershipType",
        "Class",
        "PropertyType",
        "PropertySubType",
        "TypeOwn1Out",
        "TypeOwn",
        "BuildingType",
        "BuildingTypeName"
      ]),
      transactionType: inferTransactionType(record),
      permToAdvertise: pickPermToAdvertise(record),
      permissionSignals: {
        permToAdvertise: readRawPermissionSignal(record, "PermToAdvertise"),
        permToAdvertiseYN: readRawPermissionSignal(record, "PermToAdvertiseYN"),
        permitToAdvertise: readRawPermissionSignal(record, "PermitToAdvertise"),
        internetEntireListingDisplayYN: readRawPermissionSignal(record, "InternetEntireListingDisplayYN"),
        internetAddressDisplayYN: readRawPermissionSignal(record, "InternetAddressDisplayYN")
      },
      municipality: pickString(record, ["Municipality", "City", "CommunityName"]),
      area: pickString(record, ["Area", "Community", "Neighbourhood"]),
      address: {
        streetNumber: pickString(record, ["StreetNumber", "StreetNum"]),
        streetName: pickString(record, ["StreetName", "Street"]),
        unit: pickString(record, ["UnitNumber", "UnitNum", "Apt"]),
        fullAddress: pickString(record, ["UnparsedAddress", "Address", "FullAddress"]),
        postalCode: pickString(record, ["PostalCode", "Postcode", "Zip"])
      },
      listPrice,
      leaseAmount,
      leasePrice,
      totalActualRent,
      leaseAmountFrequency,
      leasePerUnit,
      existingLeaseType,
      bedrooms: pickNumber(record, ["BedroomsTotal", "Bedrooms", "Beds"]),
      bathrooms: pickNumber(record, ["BathroomsTotalInteger", "Bathrooms", "Baths"]),
      propertyType: pickString(record, [
        "PropertyType",
        "PropertySubType",
        "PropertyTypeDetail",
        "Type",
        "TypeOwn1Out",
        "BuildingType",
        "BuildingTypeName"
      ]),
      commonInterest: pickString(record, ["CommonInterest"]),
      style: pickString(record, ["ArchitecturalStyle", "Style"]),
      publicRemarks: pickString(record, ["PublicRemarks", "Remarks", "Description"]),
      images: mapImages(record),
      coordinates: {
        latitude: pickNumber(record, ["Latitude", "Lat"]),
        longitude: pickNumber(record, ["Longitude", "Lng", "Lon"])
      },
      brokerageName: pickString(record, ["ListOfficeName", "BrokerageName"]),
      status: pickString(record, ["StandardStatus", "Status"]),
      sourceUpdatedAt: pickString(record, ["ModificationTimestamp", "SourceUpdatedAt", "UpdatedAt", "Timestamp"])
    };
  }
}

function readRawPermissionSignal(record: JsonObject, key: string): string | boolean | null {
  const value = record[key];
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value;
  if (typeof value === "number") return value === 1 ? true : value === 0 ? false : String(value);
  return null;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required server env var: ${name}`);
  }
  return value;
}

function pickString(record: JsonObject, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return null;
}

function pickNumber(record: JsonObject, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replace(/[,$]/g, ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function pickPermToAdvertise(record: JsonObject): "Yes" | "No" | boolean | null {
  // For this feed, use InternetEntireListingDisplayYN as the authoritative public-display permission signal.
  const internetEntire = pickBoolean(record, ["InternetEntireListingDisplayYN"]);
  if (internetEntire != null) return internetEntire;

  return null;
}

function pickBoolean(record: JsonObject, keys: string[]): boolean | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "number") {
      if (value === 1) return true;
      if (value === 0) return false;
    }
    if (typeof value === "string" && value.trim()) {
      const normalized = value.trim().toLowerCase();
      if (["true", "yes", "y", "1"].includes(normalized)) return true;
      if (["false", "no", "n", "0"].includes(normalized)) return false;
    }
  }
  return null;
}

function mapImages(record: JsonObject): RawMLSFeedListing["images"] {
  const media = record["Media"];
  if (!Array.isArray(media)) return [];

  const items = media
    .map((entry): MLSListingMedia | null => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as JsonObject;
      const url = pickString(row, ["MediaURL", "Url", "url"]);
      if (!url) return null;
      const mediaCategory = pickString(row, ["MediaCategory", "Category", "MediaType"]) || "";
      if (!isDisplayableImage(url, mediaCategory)) return null;
      return {
        url,
        type: "photo",
        caption: pickString(row, ["LongDescription", "Caption", "caption"]),
        sortOrder: pickNumber(row, ["Order", "SortOrder", "MediaOrder"])
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return items;
}

function isDisplayableImage(url: string, mediaCategory: string): boolean {
  const normalizedCategory = mediaCategory.trim().toLowerCase();
  if (normalizedCategory !== "property photo") {
    return false;
  }

  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(pathname);
  } catch {
    return false;
  }
}

function extractListingsArray(payload: unknown): JsonObject[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload.filter(isJsonObject);
  if (!isJsonObject(payload)) return [];

  const candidates = ["value", "results", "data", "listings", "Listings", "items"];
  for (const key of candidates) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value.filter(isJsonObject);
    }
  }

  if (isJsonObject(payload["d"]) && Array.isArray((payload["d"] as JsonObject)["results"])) {
    return ((payload["d"] as JsonObject)["results"] as unknown[]).filter(isJsonObject);
  }

  return [];
}

function extractNextUrl(payload: unknown): string | null {
  if (!isJsonObject(payload)) return null;
  const next = pickString(payload, ["@odata.nextLink", "next", "nextLink", "next_page_url"]);
  if (next) return next;
  if (isJsonObject(payload["d"])) {
    return pickString(payload["d"] as JsonObject, ["__next"]);
  }
  return null;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function shouldRetryDdfError(error: unknown): boolean {
  if (!(error instanceof Error)) return true;
  const message = error.message || "";
  if (/401/.test(message)) {
    logSyncWarn("DDF auth token expired; retrying with refresh.");
    return true;
  }
  return /429|5\d\d|timeout|network|fetch/i.test(message);
}

function inferTransactionType(record: JsonObject): string {
  const listPrice = pickNumber(record, ["ListPrice", "Price"]);
  const totalActualRent = pickNumber(record, ["TotalActualRent"]);

  // Strict business rule from product requirement:
  // Lease:  ListPrice null + TotalActualRent not null
  // Sale:   ListPrice not null + TotalActualRent null
  if (listPrice == null && totalActualRent != null) return "lease";
  if (listPrice != null && totalActualRent == null) return "sale";

  // Fallbacks for rare inconsistent records:
  if (totalActualRent != null) return "lease";
  return "sale";
}

function buildDefaultResidentialFilter(): string {
  const residentialSubTypes = ["Single Family", "Multi-family"];
  const subTypeFilter = residentialSubTypes.map((value) => `PropertySubType eq '${value}'`).join(" or ");
  const statusFilter = "StandardStatus eq 'Active'";
  return `(${subTypeFilter}) and (${statusFilter})`;
}
