import type { School } from "@/types/school";

const YRDSB_ELEMENTARY_BOUNDARIES =
  "https://www2.yrdsb.ca/schools-programs/school-boundaries/elementary-boundaries";
const YRDSB_SECONDARY_BOUNDARIES =
  "https://www2.yrdsb.ca/schools-programs/school-boundaries/secondary-boundaries";
const YRDSB_LOCATOR = "https://schoollocator.yrdsb.ca/";
const TDSB_LOCATOR = "https://www.tdsb.on.ca/Find-your/School/By-Home-Address";
const ONTARIO_SIFT = "https://www.app.edu.gov.on.ca/eng/sift/index.asp";

export const schools: School[] = [
  {
    id: "yrdsb-241",
    slug: "moraine-hills-ps-richmond-hill",
    name: "Moraine Hills P.S.",
    board: "York Region District School Board",
    municipality: "Richmond Hill",
    level: "elementary",
    latitude: 43.9417,
    longitude: -79.4605,
    grades: "Elementary",
    programs: ["Regular Track"],
    boundaryMapUrl: "https://schoollocator.yrdsb.ca/Planning/Documents/Boundary/241Boundary.pdf",
    boundaryDirectoryUrl: YRDSB_ELEMENTARY_BOUNDARIES,
    locatorUrl: YRDSB_LOCATOR,
    profileUrl: ONTARIO_SIFT,
    notes:
      "Official YRDSB PDF boundary available. The boundary map notes a June 2025 map update and should be verified with the board before a purchase decision.",
    dataSource: "YRDSB boundary directory and Ontario School Information Finder",
    updatedLabel: "Boundary map updated June 2025"
  },
  {
    id: "yrdsb-bayview-ss",
    slug: "bayview-ss-richmond-hill",
    name: "Bayview S.S.",
    board: "York Region District School Board",
    municipality: "Richmond Hill",
    level: "secondary",
    latitude: 43.8729,
    longitude: -79.4242,
    grades: "Secondary",
    programs: ["Regular Track", "International Baccalaureate"],
    boundaryDirectoryUrl: YRDSB_SECONDARY_BOUNDARIES,
    locatorUrl: YRDSB_LOCATOR,
    profileUrl: ONTARIO_SIFT,
    notes: "Boundary should be verified with YRDSB because programs and holding areas can affect eligibility.",
    dataSource: "YRDSB boundary directory and Ontario School Information Finder"
  },
  {
    id: "yrdsb-richmond-green-ss",
    slug: "richmond-green-ss-richmond-hill",
    name: "Richmond Green S.S.",
    board: "York Region District School Board",
    municipality: "Richmond Hill",
    level: "secondary",
    latitude: 43.9039,
    longitude: -79.3918,
    grades: "Secondary",
    programs: ["Regular Track"],
    boundaryDirectoryUrl: YRDSB_SECONDARY_BOUNDARIES,
    locatorUrl: YRDSB_LOCATOR,
    profileUrl: ONTARIO_SIFT,
    notes: "Useful Richmond Hill search anchor while exact polygon boundaries are being digitized.",
    dataSource: "YRDSB boundary directory and Ontario School Information Finder"
  },
  {
    id: "yrdsb-unionville-hs",
    slug: "unionville-hs-markham",
    name: "Unionville H.S.",
    board: "York Region District School Board",
    municipality: "Markham",
    level: "secondary",
    latitude: 43.8585,
    longitude: -79.3141,
    grades: "Secondary",
    programs: ["Regular Track", "Arts Unionville"],
    boundaryDirectoryUrl: YRDSB_SECONDARY_BOUNDARIES,
    locatorUrl: YRDSB_LOCATOR,
    profileUrl: ONTARIO_SIFT,
    notes: "Program eligibility can differ from home-school eligibility; verify directly with the board.",
    dataSource: "YRDSB boundary directory and Ontario School Information Finder"
  },
  {
    id: "yrdsb-stouffville-district-ss",
    slug: "stouffville-district-ss-whitchurch-stouffville",
    name: "Stouffville District S.S.",
    board: "York Region District School Board",
    municipality: "Whitchurch-Stouffville",
    level: "secondary",
    latitude: 43.9721,
    longitude: -79.2421,
    grades: "Secondary",
    programs: ["Regular Track"],
    boundaryDirectoryUrl: YRDSB_SECONDARY_BOUNDARIES,
    locatorUrl: YRDSB_LOCATOR,
    profileUrl: ONTARIO_SIFT,
    notes: "Included as a York Region secondary search example.",
    dataSource: "YRDSB boundary directory and Ontario School Information Finder"
  },
  {
    id: "tdsb-earl-haig-ss",
    slug: "earl-haig-ss-toronto",
    name: "Earl Haig S.S.",
    board: "Toronto District School Board",
    municipality: "Toronto",
    level: "secondary",
    latitude: 43.7689,
    longitude: -79.4089,
    grades: "Secondary",
    programs: ["Regular Track", "Claude Watson Arts Program"],
    locatorUrl: TDSB_LOCATOR,
    profileUrl: ONTARIO_SIFT,
    notes: "TDSB school assignment should be verified through the official address lookup.",
    dataSource: "TDSB school locator and Ontario School Information Finder"
  }
];
