import type { RawFeedListingPayload } from "@/types/firebase-sync";

export const mockRawFeedListings: RawFeedListingPayload[] = [
  {
    sourceSystem: "approved-mls-ddf",
    sourceListingKey: "ddf-10001",
    mlsNumber: "N9001001",
    propertyClass: "Residential Freehold",
    transactionType: "Sale",
    permToAdvertise: "Yes",
    municipality: "Vaughan",
    area: "Patterson",
    address: {
      streetNumber: "52",
      streetName: "Autumn Crest Avenue",
      unit: null,
      fullAddress: "52 Autumn Crest Avenue, Vaughan",
      postalCode: "L6A4H8"
    },
    listPrice: 1689000,
    bedrooms: 4,
    bathrooms: 4,
    propertyType: "Detached",
    style: "2-Storey",
    publicRemarks: "Bright detached home with upgraded kitchen and landscaped backyard.",
    media: [
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c", type: "photo", sortOrder: 1 },
      { url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6", type: "photo", sortOrder: 2 }
    ],
    coordinates: { latitude: 43.8417, longitude: -79.5201 },
    brokerageName: "Example Brokerage",
    status: "Active",
    sourceUpdatedAt: "2026-04-08T09:00:00.000Z"
  },
  {
    sourceSystem: "approved-mls-ddf",
    sourceListingKey: "ddf-10002",
    mlsNumber: "N9001002",
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
    propertyType: "Condo Apartment",
    style: "Apartment",
    publicRemarks: "Stylish condo with skyline views and premium amenities.",
    media: [{ url: "https://images.unsplash.com/photo-1494526585095-c41746248156", type: "photo", sortOrder: 1 }],
    coordinates: { latitude: 43.7082, longitude: -79.3903 },
    brokerageName: "Example Brokerage",
    status: "Active",
    sourceUpdatedAt: "2026-04-08T10:00:00.000Z"
  },
  {
    sourceSystem: "approved-mls-ddf",
    sourceListingKey: "ddf-10003",
    mlsNumber: "N9001005",
    propertyClass: "Residential Freehold",
    transactionType: "Sale",
    permToAdvertise: "Yes",
    municipality: "King",
    area: "Nobleton",
    address: {
      streetNumber: "18",
      streetName: "Willow Ridge Court",
      fullAddress: "18 Willow Ridge Court, King",
      postalCode: "L7B0A1"
    },
    listPrice: 1895000,
    bedrooms: 4,
    bathrooms: 4,
    propertyType: "Detached",
    style: "2-Storey",
    publicRemarks: "Public-safe example listing in King for municipality eligibility coverage.",
    status: "Active",
    sourceUpdatedAt: "2026-04-08T10:30:00.000Z"
  },
  {
    sourceSystem: "approved-mls-ddf",
    sourceListingKey: "ddf-10004",
    mlsNumber: "N9001003",
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
    publicRemarks: "Commercial example intentionally excluded by class filter.",
    status: "Active",
    sourceUpdatedAt: "2026-04-08T11:00:00.000Z"
  },
  {
    sourceSystem: "approved-mls-ddf",
    sourceListingKey: "ddf-10005",
    mlsNumber: "N9001004",
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
    publicRemarks: "Example excluded because advertising permission is No.",
    status: "Active",
    sourceUpdatedAt: "2026-04-08T12:00:00.000Z"
  }
];
