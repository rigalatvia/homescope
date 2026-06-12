import type { PrimaryMarketPage } from "@/lib/locations/markets";

export interface NeighborhoodPage {
  city: PrimaryMarketPage["city"];
  slug: string;
  name: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  searchAliases: string[];
  highlights: string[];
}

export const NEIGHBORHOOD_PAGES: NeighborhoodPage[] = [
  {
    city: "Vaughan",
    slug: "maple",
    name: "Maple",
    metaTitle: "Maple Vaughan Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Browse Maple Vaughan homes for sale and lease, nearby schools, current listings, and local price stats on HomeScope GTA.",
    intro:
      "Maple is a central Vaughan community with established residential streets, newer subdivisions, parks, schools, and access to major routes for commuters.",
    searchAliases: ["Maple"],
    highlights: ["Central Vaughan location", "Detached homes, townhomes, and condos", "School-aware listing research"]
  },
  {
    city: "Vaughan",
    slug: "patterson",
    name: "Patterson",
    metaTitle: "Patterson Vaughan Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Search Patterson Vaughan homes for sale and lease with nearby schools, current listings, and neighborhood price stats.",
    intro:
      "Patterson is one of Vaughan's most searched family-oriented areas, known for larger homes, parks, schools, and convenient access to Thornhill and Maple.",
    searchAliases: ["Patterson"],
    highlights: ["Family-focused residential streets", "Strong school-search demand", "Freehold-heavy housing mix"]
  },
  {
    city: "Vaughan",
    slug: "thornhill",
    name: "Thornhill",
    metaTitle: "Thornhill Vaughan Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Explore Thornhill Vaughan homes for sale and lease, school-area context, current listings, and price stats.",
    intro:
      "Thornhill sits along Vaughan's southern edge with access to transit, established neighborhoods, condos, townhomes, and school-area search demand.",
    searchAliases: ["Thornhill", "Crestwood", "Beverley Glen", "Brownridge", "Uplands"],
    highlights: ["Established southern Vaughan neighborhoods", "Condos, townhomes, and freeholds", "Transit and school-search appeal"]
  },
  {
    city: "Vaughan",
    slug: "kleinburg",
    name: "Kleinburg",
    metaTitle: "Kleinburg Vaughan Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Find Kleinburg Vaughan homes for sale and lease with current listings, schools to research, and local price stats.",
    intro:
      "Kleinburg is known for estate homes, newer luxury communities, green space, and village-style amenities in northwest Vaughan.",
    searchAliases: ["Kleinburg"],
    highlights: ["Luxury and estate-home demand", "Northwest Vaughan setting", "Green space and village amenities"]
  },
  {
    city: "Vaughan",
    slug: "woodbridge",
    name: "Woodbridge",
    metaTitle: "Woodbridge Vaughan Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Browse Woodbridge Vaughan homes for sale and lease, nearby schools, current listings, and neighborhood price stats.",
    intro:
      "Woodbridge covers a broad west Vaughan area with established homes, newer pockets, shopping, parks, schools, and convenient highway access.",
    searchAliases: ["Woodbridge", "East Woodbridge", "West Woodbridge", "Islington Woods", "Sonoma Heights"],
    highlights: ["Broad west Vaughan housing mix", "Established and newer residential pockets", "Highway access and local amenities"]
  },
  {
    city: "Richmond Hill",
    slug: "oak-ridges",
    name: "Oak Ridges",
    metaTitle: "Oak Ridges Richmond Hill Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Browse Oak Ridges Richmond Hill homes for sale and lease, nearby schools, current listings, and local price stats.",
    intro:
      "Oak Ridges is a north Richmond Hill community with family homes, townhomes, parks, trails, and access to schools and commuter routes.",
    searchAliases: ["Oak Ridges"],
    highlights: ["North Richmond Hill setting", "Family homes and townhomes", "Parks, trails, and school research demand"]
  },
  {
    city: "Richmond Hill",
    slug: "langstaff",
    name: "Langstaff",
    metaTitle: "Langstaff Richmond Hill Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Search Langstaff Richmond Hill homes for sale and lease with current listings, schools, and local price stats.",
    intro:
      "Langstaff offers a mix of condos, townhomes, and detached properties near major roads, transit connections, shopping, and local schools.",
    searchAliases: ["Langstaff"],
    highlights: ["Transit-oriented Richmond Hill area", "Condos, townhomes, and detached homes", "Convenient shopping and commuter access"]
  },
  {
    city: "Richmond Hill",
    slug: "jefferson",
    name: "Jefferson",
    metaTitle: "Jefferson Richmond Hill Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Explore Jefferson Richmond Hill homes for sale and lease, nearby schools, current listings, and neighborhood price stats.",
    intro:
      "Jefferson is a residential north Richmond Hill area with newer family homes, parks, schools, and access to surrounding York Region communities.",
    searchAliases: ["Jefferson"],
    highlights: ["Newer residential pockets", "Family-focused search demand", "Access to parks and schools"]
  },
  {
    city: "Richmond Hill",
    slug: "mill-pond",
    name: "Mill Pond",
    metaTitle: "Mill Pond Richmond Hill Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Find Mill Pond Richmond Hill homes for sale and lease with current listings, school context, and price stats.",
    intro:
      "Mill Pond is an established Richmond Hill neighborhood known for mature streets, local parks, character homes, and central access.",
    searchAliases: ["Mill Pond"],
    highlights: ["Established central Richmond Hill area", "Mature streets and local parks", "Character-home and family-home appeal"]
  },
  {
    city: "Richmond Hill",
    slug: "crosby",
    name: "Crosby",
    metaTitle: "Crosby Richmond Hill Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Browse Crosby Richmond Hill homes for sale and lease, nearby schools, current listings, and local price stats.",
    intro:
      "Crosby is a central Richmond Hill community with established homes, local schools, parks, and access to transit and amenities.",
    searchAliases: ["Crosby"],
    highlights: ["Central Richmond Hill location", "Established residential streets", "Schools, parks, and transit access"]
  },
  {
    city: "Richmond Hill",
    slug: "bayview-hill",
    name: "Bayview Hill",
    metaTitle: "Bayview Hill Richmond Hill Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Search Bayview Hill Richmond Hill homes for sale and lease with school research, current listings, and price stats.",
    intro:
      "Bayview Hill is a well-known Richmond Hill community with larger homes, quiet residential streets, and strong school-search interest.",
    searchAliases: ["Bayview Hill"],
    highlights: ["Larger-home neighborhood", "Strong school-search interest", "Established residential setting"]
  },
  {
    city: "Richmond Hill",
    slug: "westbrook",
    name: "Westbrook",
    metaTitle: "Westbrook Richmond Hill Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Explore Westbrook Richmond Hill homes for sale and lease, nearby schools, current listings, and price stats.",
    intro:
      "Westbrook is a family-oriented Richmond Hill neighborhood with detached homes, parks, schools, and access to nearby community amenities.",
    searchAliases: ["Westbrook"],
    highlights: ["Family-oriented streets", "Detached-home demand", "Parks and school research context"]
  },
  {
    city: "Aurora",
    slug: "aurora-highlands",
    name: "Aurora Highlands",
    metaTitle: "Aurora Highlands Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Browse Aurora Highlands homes for sale and lease with nearby schools, current listings, and neighborhood price stats.",
    intro:
      "Aurora Highlands is an established Aurora neighborhood with residential streets, schools, parks, and a mix of family homes.",
    searchAliases: ["Aurora Highlands"],
    highlights: ["Established Aurora community", "Family-home search demand", "Schools and parks nearby"]
  },
  {
    city: "Aurora",
    slug: "hills-of-st-andrew",
    name: "Hills of St Andrew",
    metaTitle: "Hills of St Andrew Aurora Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Search Hills of St Andrew Aurora homes for sale and lease with current listings, nearby schools, and local price stats.",
    intro:
      "Hills of St Andrew is a north Aurora area known for larger homes, ravine settings, mature streets, and local school research demand.",
    searchAliases: ["Hills of St Andrew", "St Andrew"],
    highlights: ["Larger-home Aurora area", "Mature streets and green space", "School-aware search context"]
  },
  {
    city: "Aurora",
    slug: "aurora-village",
    name: "Aurora Village",
    metaTitle: "Aurora Village Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Explore Aurora Village homes for sale and lease, school context, current listings, and neighborhood price stats.",
    intro:
      "Aurora Village offers central access to local amenities, older residential streets, transit, schools, and community services.",
    searchAliases: ["Aurora Village"],
    highlights: ["Central Aurora location", "Local amenities and transit", "Established streets and schools"]
  },
  {
    city: "Aurora",
    slug: "aurora-heights",
    name: "Aurora Heights",
    metaTitle: "Aurora Heights Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Find Aurora Heights homes for sale and lease with current listings, schools to research, and price stats.",
    intro:
      "Aurora Heights is an established residential area with schools, parks, and a practical mix of family housing options.",
    searchAliases: ["Aurora Heights"],
    highlights: ["Established residential area", "Schools and parks nearby", "Family housing options"]
  },
  {
    city: "Newmarket",
    slug: "stonehaven-wyndham",
    name: "Stonehaven-Wyndham",
    metaTitle: "Stonehaven-Wyndham Newmarket Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Browse Stonehaven-Wyndham Newmarket homes for sale and lease with nearby schools, current listings, and price stats.",
    intro:
      "Stonehaven-Wyndham is a sought-after Newmarket community with larger homes, quiet streets, parks, and school-search demand.",
    searchAliases: ["Stonehaven", "Wyndham"],
    highlights: ["Sought-after Newmarket community", "Larger homes and quiet streets", "School and park access"]
  },
  {
    city: "Newmarket",
    slug: "summerhill-estates",
    name: "Summerhill Estates",
    metaTitle: "Summerhill Estates Newmarket Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Search Summerhill Estates Newmarket homes for sale and lease with current listings, schools, and price stats.",
    intro:
      "Summerhill Estates is a family-oriented Newmarket area with residential streets, parks, schools, and convenient local amenities.",
    searchAliases: ["Summerhill"],
    highlights: ["Family-oriented Newmarket area", "Residential streets and parks", "School-search appeal"]
  },
  {
    city: "Newmarket",
    slug: "central-newmarket",
    name: "Central Newmarket",
    metaTitle: "Central Newmarket Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Explore Central Newmarket homes for sale and lease, nearby schools, current listings, and local price stats.",
    intro:
      "Central Newmarket offers access to local amenities, transit, established streets, and a varied mix of home types.",
    searchAliases: ["Central Newmarket"],
    highlights: ["Central location", "Transit and amenities", "Established streets and varied home types"]
  },
  {
    city: "Newmarket",
    slug: "woodland-hill",
    name: "Woodland Hill",
    metaTitle: "Woodland Hill Newmarket Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Find Woodland Hill Newmarket homes for sale and lease with current listings, school context, and price stats.",
    intro:
      "Woodland Hill is a northwest Newmarket community with newer homes, shopping access, parks, and school research interest.",
    searchAliases: ["Woodland Hill"],
    highlights: ["Northwest Newmarket community", "Newer homes and townhomes", "Shopping, parks, and schools"]
  },
  {
    city: "King",
    slug: "king-city",
    name: "King City",
    metaTitle: "King City Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Browse King City homes for sale and lease with current listings, schools to research, and local price stats.",
    intro:
      "King City is a central King community with estate homes, detached properties, schools, local amenities, and commuter access.",
    searchAliases: ["King City"],
    highlights: ["Estate and detached-home demand", "Central King location", "Schools and commuter access"]
  },
  {
    city: "King",
    slug: "nobleton",
    name: "Nobleton",
    metaTitle: "Nobleton Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Search Nobleton homes for sale and lease with current listings, school context, and neighborhood price stats.",
    intro:
      "Nobleton is a west King community with detached homes, newer subdivisions, local amenities, schools, and larger-property appeal.",
    searchAliases: ["Nobleton"],
    highlights: ["West King community", "Detached homes and newer subdivisions", "Larger-property appeal"]
  },
  {
    city: "King",
    slug: "schomberg",
    name: "Schomberg",
    metaTitle: "Schomberg Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Explore Schomberg homes for sale and lease with current listings, schools to research, and local price stats.",
    intro:
      "Schomberg offers small-town character in King with residential streets, local shops, surrounding countryside, and commuter routes.",
    searchAliases: ["Schomberg"],
    highlights: ["Small-town King setting", "Local shops and residential streets", "Surrounding countryside"]
  },
  {
    city: "Toronto",
    slug: "downtown-toronto",
    name: "Downtown Toronto",
    metaTitle: "Downtown Toronto Homes & Condos for Sale and Lease | HomeScope GTA",
    metaDescription:
      "Browse Downtown Toronto homes and condos for sale and lease with current listings, school context, and price stats.",
    intro:
      "Downtown Toronto is a high-demand urban market with condos, rentals, townhomes, transit access, employment nodes, and cultural amenities.",
    searchAliases: ["Downtown"],
    highlights: ["High-demand urban market", "Condos, rentals, and townhomes", "Transit, work, and amenity access"]
  },
  {
    city: "Toronto",
    slug: "scarborough",
    name: "Scarborough",
    metaTitle: "Scarborough Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Search Scarborough homes for sale and lease with current listings, nearby schools, and local price stats.",
    intro:
      "Scarborough offers a wide range of housing options across east Toronto, including condos, townhomes, detached homes, and family neighborhoods.",
    searchAliases: ["Scarborough"],
    highlights: ["Broad east Toronto market", "Condos, townhomes, and detached homes", "School and transit search demand"]
  },
  {
    city: "Toronto",
    slug: "north-york",
    name: "North York",
    metaTitle: "North York Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Explore North York homes for sale and lease with current listings, school context, and local price stats.",
    intro:
      "North York includes major condo corridors, established residential pockets, transit access, shopping, schools, and employment areas.",
    searchAliases: ["North York"],
    highlights: ["Major condo and residential market", "Transit and shopping access", "Schools and employment areas"]
  },
  {
    city: "Toronto",
    slug: "the-beaches",
    name: "The Beaches",
    metaTitle: "The Beaches Toronto Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Find The Beaches Toronto homes for sale and lease with current listings, schools to research, and price stats.",
    intro:
      "The Beaches is an east Toronto neighborhood known for lake access, local shops, character homes, condos, and strong lifestyle appeal.",
    searchAliases: ["The Beaches", "Beach"],
    highlights: ["Lake access and local shops", "Character homes and condos", "Strong lifestyle appeal"]
  },
  {
    city: "Toronto",
    slug: "etobicoke",
    name: "Etobicoke",
    metaTitle: "Etobicoke Homes for Sale & Lease | HomeScope GTA",
    metaDescription:
      "Browse Etobicoke homes for sale and lease with current listings, nearby schools, and local price stats.",
    intro:
      "Etobicoke covers west Toronto communities with condos, detached homes, ravine settings, lakefront pockets, schools, and commuter routes.",
    searchAliases: ["Etobicoke"],
    highlights: ["West Toronto market", "Condos and detached homes", "Lakefront, ravine, and commuter appeal"]
  }
];

export function getNeighborhoodBySlug(city: string, slug: string): NeighborhoodPage | undefined {
  const normalizedCity = normalize(city);
  const normalizedSlug = normalize(slug);
  return NEIGHBORHOOD_PAGES.find(
    (neighborhood) => normalize(neighborhood.city) === normalizedCity && normalize(neighborhood.slug) === normalizedSlug
  );
}

export function getNeighborhoodsByCity(city: string): NeighborhoodPage[] {
  const normalizedCity = normalize(city);
  return NEIGHBORHOOD_PAGES.filter((neighborhood) => normalize(neighborhood.city) === normalizedCity);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
