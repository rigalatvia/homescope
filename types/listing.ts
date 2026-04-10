export type ListingStatus = "active" | "sold" | "leased" | "pending";
export type ListingTransactionType = "sale" | "lease";

export type PropertyType = string;

export interface Listing {
  id: string;
  mlsNumber: string;
  title: string;
  price: number;
  city: string;
  area: string;
  address: string;
  postalCode?: string;
  bedrooms: number;
  bathrooms: number;
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
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedListings {
  items: Listing[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
