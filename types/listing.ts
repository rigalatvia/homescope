export type ListingStatus = "active" | "sold" | "leased" | "pending";
export type ListingTransactionType = "sale" | "lease";
export type ListingSort = "price_asc" | "price_desc" | "newest";

export type PropertyType = string;

export interface Listing {
  id: string;
  mlsNumber: string;
  listAgentNationalAssociationId?: string;
  listAgentKey?: string;
  title: string;
  price: number;
  city: string;
  area: string;
  address: string;
  postalCode?: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage?: string;
  propertyType: PropertyType;
  transactionType: ListingTransactionType;
  description: string;
  images: string[];
  isPubliclyAdvertisable: boolean;
  status: ListingStatus;
  listingUrlSlug: string;
  badge?: "New" | "Hot";
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListingFilters {
  city?: string;
  transactionType?: ListingTransactionType;
  sort?: ListingSort;
  addressContains?: string;
  mlsNumber?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bedroomsMatch?: "exact" | "atLeast";
  bathrooms?: number;
  bathroomsMatch?: "exact" | "atLeast";
  propertyType?: string;
  minLatitude?: number;
  maxLatitude?: number;
  minLongitude?: number;
  maxLongitude?: number;
  page?: number;
  pageSize?: number;
}

export interface PaginatedListings {
  items: Listing[];
  allItems?: Listing[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
