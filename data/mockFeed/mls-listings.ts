import type { RawMLSFeedListing } from "@/lib/mls/types";

export const mockMLSFeedListings: RawMLSFeedListing[] = [
  {
    sourceSystem: "approved-mls-ddf",
    sourceListingKey: "mock-mls-1001",
    mlsNumber: "N9003001",
    propertyClass: "Residential Freehold",
    transactionType: "Sale",
    permToAdvertise: "Yes",
    municipality: "Vaughan",
    area: "Patterson",
    address: {
      streetNumber: "52",
      streetName: "Autumn Crest Avenue",
      fullAddress: "52 Autumn Crest Avenue, Vaughan",
      postalCode: "L6A4H8"
    },
    listPrice: 1689000,
    bedrooms: 4,
    bathrooms: 4,
    propertyType: "Detached",
    style: "2-Storey",
    publicRemarks: "Eligible listing. Public remarks and photos present.",
    images: [
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c", type: "photo", sortOrder: 1 },
      { url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6", type: "photo", sortOrder: 2 }
    ],
    coordinates: { latitude: 43.8417, longitude: -79.5201 },
    brokerageName: "Brokerage One",
    status: "Active",
    sourceUpdatedAt: "2026-04-09T01:00:00.000Z"
  },
  {
    sourceSystem: "approved-mls-ddf",
    sourceListingKey: "mock-mls-1002",
    mlsNumber: "N9003002",
    propertyClass: "Residential Condo & Other",
    transactionType: "Sale",
    permToAdvertise: "Yes",
    municipality: "Toronto",
    area: "Midtown",
    address: {
      streetNumber: "125",
      streetName: "Redpath Avenue",
      unit: "2307",
      fullAddress: "2307-125 Redpath Avenue, Toronto",
      postalCode: "M4P0B6"
    },
    listPrice: 789000,
    bedrooms: 2,
    bathrooms: 2,
    propertyType: "Condo",
    style: "Apartment",
    publicRemarks: "Eligible condo listing in allowed municipality.",
    images: [{ url: "https://images.unsplash.com/photo-1494526585095-c41746248156", type: "photo", sortOrder: 1 }],
    coordinates: { latitude: 43.7082, longitude: -79.3903 },
    brokerageName: "Brokerage Two",
    status: "Active",
    sourceUpdatedAt: "2026-04-09T01:15:00.000Z"
  },
  {
    sourceSystem: "approved-mls-ddf",
    sourceListingKey: "mock-mls-1003",
    mlsNumber: "N9003003",
    propertyClass: "Residential Freehold",
    transactionType: "Sale",
    permToAdvertise: "No",
    municipality: "Richmond Hill",
    area: "Jefferson",
    address: {
      streetNumber: "64",
      streetName: "Rising Hill Ridge",
      fullAddress: "64 Rising Hill Ridge, Richmond Hill",
      postalCode: "L4E5B9"
    },
    listPrice: 2749000,
    bedrooms: 5,
    bathrooms: 6,
    propertyType: "Detached",
    style: "2-Storey",
    publicRemarks: "Excluded due to permToAdvertise = No.",
    images: [],
    status: "Active",
    sourceUpdatedAt: "2026-04-09T02:00:00.000Z"
  },
  {
    sourceSystem: "approved-mls-ddf",
    sourceListingKey: "mock-mls-1004",
    mlsNumber: "N9003004",
    propertyClass: "Commercial",
    transactionType: "Sale",
    permToAdvertise: "Yes",
    municipality: "Vaughan",
    area: "Concord",
    address: {
      streetNumber: "40",
      streetName: "Industrial Road",
      fullAddress: "40 Industrial Road, Vaughan",
      postalCode: "L4K1A1"
    },
    listPrice: 2200000,
    bedrooms: null,
    bathrooms: null,
    propertyType: "Industrial",
    style: null,
    publicRemarks: "Excluded due to unsupported property class.",
    images: [],
    status: "Active",
    sourceUpdatedAt: "2026-04-09T02:30:00.000Z"
  },
  {
    sourceSystem: "approved-mls-ddf",
    sourceListingKey: "mock-mls-1005",
    mlsNumber: "N9003005",
    propertyClass: "Residential Condo & Other Lease",
    transactionType: "Lease",
    permToAdvertise: "Yes",
    municipality: "Markham",
    area: "Unionville",
    address: {
      streetNumber: "88",
      streetName: "Main Street",
      fullAddress: "88 Main Street, Markham",
      postalCode: "L3R0G1"
    },
    listPrice: 3200,
    bedrooms: 2,
    bathrooms: 2,
    propertyType: "Condo",
    style: "Apartment",
    publicRemarks: "Excluded due to municipality outside allowed list.",
    images: [],
    status: "Active",
    sourceUpdatedAt: "2026-04-09T03:00:00.000Z"
  }
];
