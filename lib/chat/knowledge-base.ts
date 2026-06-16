import type { ChatSuggestedLink } from "@/types/chat";

interface ChatKnowledgeArticle {
  id: string;
  title: string;
  href: string;
  keywords: string[];
  summary: string;
  answer: string[];
}

const KNOWLEDGE_BASE: ChatKnowledgeArticle[] = [
  {
    id: "how-to-use-site",
    title: "How to Use HomeScope GTA",
    href: "/about",
    keywords: [
      "how to use",
      "use website",
      "use site",
      "what can i do",
      "features",
      "functionality",
      "help",
      "start",
      "where do i begin",
      "navigate",
      "website"
    ],
    summary: "Explains the main HomeScope GTA workflows and where visitors should start.",
    answer: [
      "Start with Listings if you want to search active homes, Schools if school-area research matters, Tools if you want calculators or interactive search helpers, Guides if you need buyer or renter education, and Dashboard if you are signed in and want to manage saved homes, saved searches, alerts, notes, and showing activity.",
      "The most common flow is: filter listings, open a property detail page, save homes you like, save searches for alerts, compare saved homes in the dashboard, add private notes, and request a showing when a listing is worth a closer look."
    ]
  },
  {
    id: "tools-hub",
    title: "Real Estate Tools",
    href: "/tools",
    keywords: [
      "tools",
      "calculator",
      "calculators",
      "mortgage calculator",
      "land transfer tax calculator",
      "map search",
      "compare homes",
      "notes",
      "listing tools"
    ],
    summary: "Links visitors to calculators and interactive HomeScope GTA tools.",
    answer: [
      "The Tools page gathers HomeScope GTA's interactive features in one place: mortgage calculator, land transfer tax calculator, map search, saved search alerts, saved-home comparison, and private notes.",
      "Use Tools when you want to calculate, compare, save, or organize. Use Guides when you want educational reading and checklists."
    ]
  },
  {
    id: "how-to-search-listings",
    title: "How to Search Listings",
    href: "/listings",
    keywords: [
      "how search",
      "search listings",
      "filter listings",
      "find homes",
      "find house",
      "city filter",
      "price filter",
      "bedroom filter",
      "bathroom filter",
      "property type",
      "mls number",
      "address search",
      "apply filters",
      "clear filters"
    ],
    summary: "Explains how visitors use listing filters and listing detail pages.",
    answer: [
      "Use the Listings page to filter by city, sale or lease, price range, bedrooms, bathrooms, property type, address text, MLS number, and school proximity.",
      "After applying filters, open any listing card to see photos, details, mortgage estimates for sale listings, related guides, save controls, and the showing request form."
    ]
  },
  {
    id: "how-to-use-map-search",
    title: "How to Use Map Search",
    href: "/map-search",
    keywords: [
      "map",
      "map search",
      "search map area",
      "map area",
      "interactive map",
      "open map",
      "clear map area",
      "markers",
      "neighbourhood map",
      "neighborhood map"
    ],
    summary: "Explains the separate map-search route and map-area filtering.",
    answer: [
      "Use Map Search when you want to browse listings visually. The regular Listings page stays lighter, while the Map page loads the heavier interactive map tools only when you choose them.",
      "Filter first if you want, then move or zoom the map and choose Search This Map Area. Use Clear Map Area to remove the map boundary and return to broader results."
    ]
  },
  {
    id: "accounts-dashboard",
    title: "Accounts and Dashboard",
    href: "/dashboard",
    keywords: [
      "account",
      "sign in",
      "google sign in",
      "dashboard",
      "saved",
      "my dashboard",
      "login",
      "log in",
      "profile",
      "where are saved homes"
    ],
    summary: "Explains sign-in and dashboard functionality.",
    answer: [
      "Sign in with Google to unlock the Dashboard. The dashboard is where saved homes, saved searches, listing alerts, private notes, comparison tools, and showing requests are managed.",
      "If you are not signed in, you can still browse listings, schools, locations, reports, calculators, and guides, but saved-home and saved-search tools need an account."
    ]
  },
  {
    id: "saved-homes-notes-comparison",
    title: "Saved Homes, Notes, and Comparison",
    href: "/dashboard#saved-homes",
    keywords: [
      "saved homes",
      "save home",
      "favorite",
      "favourite",
      "heart",
      "compare",
      "comparison",
      "side by side",
      "notes",
      "private notes",
      "showing notes",
      "pros cons",
      "shortlist"
    ],
    summary: "Explains how users save homes, compare listings, and keep private notes.",
    answer: [
      "Use the Save button on listing cards or listing detail pages to keep homes in your dashboard. In Saved Homes, you can select up to four saved listings and compare them side by side.",
      "The comparison view includes price, beds, baths, square feet, property type, city, neighbourhood, taxes or fees when available, school proximity when available, a monthly estimate, and your private notes. Notes are only stored for your account."
    ]
  },
  {
    id: "saved-searches-alerts-help",
    title: "Saved Searches and Listing Alerts",
    href: "/dashboard#saved-searches",
    keywords: [
      "saved search",
      "save search",
      "alerts",
      "email alerts",
      "listing alerts",
      "new listing alert",
      "daily alerts",
      "weekly alerts",
      "instant alerts",
      "pause alerts",
      "search notification",
      "notify me"
    ],
    summary: "Explains saved searches and alert behavior.",
    answer: [
      "After filtering Listings or Map Search, choose Save Search + Alerts to save that exact search to your account. Saved searches store your filters and can be reopened from the dashboard.",
      "Alerts are designed to notify you when new or updated listings match the saved filters after HomeScope GTA syncs listing data. The first scheduled run baselines the search, and later runs email matching updates on the Instant, Daily, or Weekly frequency you choose."
    ]
  },
  {
    id: "how-to-request-showing",
    title: "How to Request a Showing",
    href: "/contact",
    keywords: [
      "request showing",
      "book showing",
      "schedule showing",
      "view property",
      "private showing",
      "contact",
      "lead form",
      "tour",
      "visit"
    ],
    summary: "Explains the listing showing request flow.",
    answer: [
      "Open a listing detail page and use the showing request form. The form sends the listing details along with your contact information and preferred timing.",
      "After submission, watch for an email from info@homescopegta.ca and check your junk folder if you do not see it. Rental requests may involve document readiness before a showing is finalized."
    ]
  },
  {
    id: "listing-search",
    title: "GTA Listing Search",
    href: "/listings",
    keywords: [
      "listing",
      "listings",
      "homes for sale",
      "homes for lease",
      "rentals",
      "condos",
      "townhomes",
      "freehold",
      "price",
      "beds",
      "bathrooms",
      "map search"
    ],
    summary: "Searches current public listings across the GTA by city, price, beds, baths, property type, and map area.",
    answer: [
      "Use the listing search when you want to compare active homes by city, price, property type, bedrooms, bathrooms, and location.",
      "HomeScope GTA supports homes for sale and lease across Vaughan, Richmond Hill, Aurora, Newmarket, King, and Toronto, with listing detail pages for photos, property facts, and showing requests."
    ]
  },
  {
    id: "city-pages",
    title: "City Market Pages",
    href: "/locations/vaughan",
    keywords: [
      "city",
      "cities",
      "vaughan",
      "richmond hill",
      "aurora",
      "newmarket",
      "king",
      "toronto",
      "active listings",
      "for sale",
      "for lease",
      "city listings",
      "market"
    ],
    summary: "Links visitors to city pages with live active, sale, lease, school, featured listing, and neighbourhood sections.",
    answer: [
      "The city pages are useful when you want a market-level view before narrowing your search.",
      "Each city page shows current listing counts, sale and lease inventory, schools, featured listings, neighbourhood links, and a path into the full listing search."
    ]
  },
  {
    id: "neighborhood-pages",
    title: "Neighbourhood Pages",
    href: "/locations/richmond-hill/jefferson",
    keywords: [
      "neighbourhood",
      "neighborhood",
      "area",
      "community",
      "maple",
      "patterson",
      "thornhill",
      "kleinburg",
      "woodbridge",
      "oak ridges",
      "jefferson",
      "mill pond",
      "crosby",
      "bayview hill",
      "westbrook",
      "stonehaven",
      "downtown toronto",
      "scarborough",
      "north york",
      "etobicoke"
    ],
    summary: "Highlights neighbourhood-level listing pages with local inventory, price snapshots, nearby schools, and current homes.",
    answer: [
      "Neighbourhood pages help narrow a city search to a more specific community, such as Patterson, Maple, Jefferson, Oak Ridges, Stonehaven-Wyndham, or North York.",
      "They show current matched listings, a price snapshot, and nearby schools selected from the local listing cluster when location data is available."
    ]
  },
  {
    id: "school-search",
    title: "School Search and School Profile Pages",
    href: "/schools",
    keywords: [
      "school",
      "schools",
      "ranking",
      "ratings",
      "board",
      "school board",
      "near school",
      "homes near",
      "aurora high",
      "bayview secondary",
      "fraser",
      "catchment"
    ],
    summary: "Searches schools, rankings, board details, dedicated school URLs, and nearby homes.",
    answer: [
      "The school search is one of the strongest HomeScope GTA tools if schools are part of the home search.",
      "Visitors can search school records, open dedicated school profile pages, review rating and board information, and continue into nearby homes. Always verify boundaries and eligibility directly with the school board before relying on an address."
    ]
  },
  {
    id: "market-reports",
    title: "Monthly Market Reports",
    href: "/market-reports/aurora/june-2026",
    keywords: [
      "market report",
      "monthly report",
      "housing market",
      "average price",
      "days live",
      "new listings",
      "inventory",
      "stats",
      "statistics",
      "june 2026",
      "vaughan",
      "richmond hill",
      "aurora",
      "newmarket",
      "king",
      "toronto",
      "editable report",
      "admin"
    ],
    summary: "Explains dynamic city market reports with live listing metrics and editable commentary.",
    answer: [
      "Monthly market reports combine automatic listing-data metrics with editable commentary.",
      "The numbers come from currently visible HomeScope GTA listing data, while the report title, intro, market summary, buyer takeaway, seller takeaway, and notes can be edited from the admin market reports screen."
    ]
  },
  {
    id: "land-transfer-tax",
    title: "Ontario Land Transfer Tax Calculator",
    href: "/tools/land-transfer-tax-calculator",
    keywords: [
      "land transfer tax",
      "ltt",
      "mltt",
      "toronto land transfer",
      "closing costs",
      "first time buyer rebate",
      "tax calculator",
      "ontario tax"
    ],
    summary: "Calculates Ontario and Toronto land transfer tax estimates with first-time buyer rebate options.",
    answer: [
      "The land transfer tax calculator estimates Ontario land transfer tax and, when Toronto is selected, the additional municipal land transfer tax.",
      "It also includes first-time buyer rebate toggles so buyers can get a clearer planning estimate before reviewing closing costs with their lawyer or mortgage professional."
    ]
  },
  {
    id: "mortgage-payment-calculator",
    title: "Ontario Mortgage Payment Calculator",
    href: "/tools/mortgage-calculator",
    keywords: [
      "mortgage calculator",
      "mortgage payment",
      "monthly payment",
      "carrying cost",
      "affordability",
      "down payment",
      "interest rate",
      "amortization",
      "mortgage term",
      "property tax",
      "condo fees"
    ],
    summary: "Estimates monthly mortgage principal, interest, and common carrying costs for Ontario and GTA homes.",
    answer: [
      "The mortgage payment calculator estimates monthly principal and interest from purchase price, down payment, rate, amortization, and term.",
      "It also lets visitors add monthly property tax, condo fees, and heating estimates so they can compare a broader monthly carrying cost before reviewing financing with a mortgage professional."
    ]
  },
  {
    id: "about-homescope",
    title: "About HomeScope GTA",
    href: "/about",
    keywords: [
      "about",
      "who",
      "team",
      "trust",
      "company",
      "homescope gta",
      "brokerage",
      "reco",
      "contact"
    ],
    summary: "Explains who HomeScope GTA is, what the platform does, and important trust/compliance notes.",
    answer: [
      "The About page explains that HomeScope GTA is a real estate search and education platform built around listings, school-area research, guides, and document organization.",
      "It also gives visitors a clearer trust page without naming individual people or brokerage details."
    ]
  },
  {
    id: "rental-application",
    title: "Ontario Rental Application Form 410",
    href: "/guides/rental-application-ontario",
    keywords: ["rental application", "form 410", "tenant application", "landlord references", "employment history"],
    summary: "Explains Ontario rental application form 410 and the information renters usually prepare before applying.",
    answer: [
      "Ontario renters often review Residential Rental Application Form 410 before serious showings so they can submit quickly once the right lease appears.",
      "The form usually asks for applicant details, address history, landlord references, employment information, banking details, financial obligations, personal references, vehicle information, and signatures."
    ]
  },
  {
    id: "lease-documents",
    title: "Documents Needed to Rent in Canada",
    href: "/guides/lease-documents",
    keywords: ["documents needed to rent", "lease documents", "proof of income", "credit report", "employment letter", "references"],
    summary: "Lists the core documents renters often gather before applying for a lease in Canada and Ontario.",
    answer: [
      "For Ontario rentals, many landlords want supporting documents such as ID, proof of income, employment confirmation, credit-related records, and references.",
      "HomeScope GTA has a Documents Needed to Rent in Canada guide so renters can see the checklist before they start booking showings."
    ]
  },
  {
    id: "leasing-guide",
    title: "Ontario Leasing Guide",
    href: "/guides/leasing",
    keywords: ["leasing", "rent home ontario", "showing request", "move in", "tenant tips", "financial obligations"],
    summary: "Covers the Ontario leasing process from budgeting and showings to applications, approvals, and move-in.",
    answer: [
      "The leasing guide is the best place to understand the rental process itself: budgeting, comparing listings, booking showings, submitting the application, landlord review, lease signing, and move-in.",
      "If your question is about process rather than paperwork, start there."
    ]
  },
  {
    id: "first-time-buyer",
    title: "First Time Home Buyer Checklist Ontario",
    href: "/guides/first-time-home-buyer-ontario",
    keywords: ["first time buyer", "mortgage pre approval", "down payment", "buy house ontario", "offer"],
    summary: "Step-by-step Ontario buyer roadmap covering finances, pre-approval, home search, offers, and closing.",
    answer: [
      "For first-time buyers in Ontario, the usual path is financial readiness, mortgage pre-approval, agent selection, listing search, offer strategy, inspection/financing, and closing.",
      "HomeScope GTA also has a dedicated first-time buyer checklist to keep that process easier to follow."
    ]
  },
  {
    id: "buyer-documents",
    title: "Documents Needed to Buy a House in Toronto",
    href: "/guides/documents-needed-buy-house-toronto",
    keywords: ["documents buy house", "toronto documents", "mortgage paperwork", "closing documents", "lawyer"],
    summary: "Explains the main ID, financial, mortgage, property, and legal documents buyers prepare in Toronto.",
    answer: [
      "Toronto buyers are usually asked for ID, income records, bank statements, mortgage documents, offer paperwork, property-related reports, and final legal closing documents.",
      "That guide is the strongest match if your question is specifically about paperwork rather than the buying timeline."
    ]
  },
  {
    id: "organize-documents",
    title: "How to Organize Real Estate Documents in Canada",
    href: "/guides/organize-real-estate-documents-canada",
    keywords: ["organize documents", "save files", "digital copies", "document hub", "canada"],
    summary: "Shows how buyers and renters can organize records, use digital storage, and track important dates.",
    answer: [
      "A good document system should separate leasing, financing, signed agreements, and reference materials into clear categories.",
      "HomeScope GTA is designed to support that kind of document organization across buying and leasing."
    ]
  },
  {
    id: "showing-request",
    title: "Showing Request Help",
    href: "/contact",
    keywords: ["showing request", "book showing", "confirmation email", "junk folder", "text messages"],
    summary: "Explains how showing requests are handled and what to expect after submission.",
    answer: [
      "After a showing request is submitted, visitors should expect an email from info@homescopegta.ca and should check their junk folder if they do not see it.",
      "For rental listings, document review may be required before the showing is finalized."
    ]
  }
];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function tokenize(value: string): string[] {
  return normalize(value)
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length >= 2);
}

export function buildChatResponse(message: string): {
  reply: string;
  suggestedLinks: ChatSuggestedLink[];
} {
  const tokens = tokenize(message);
  const scored = KNOWLEDGE_BASE.map((article) => {
    const haystack = [article.title, article.summary, ...article.keywords].join(" ").toLowerCase();
    const score = tokens.reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);
    return { article, score };
  })
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0);

  const topMatches = scored.length > 0 ? scored.slice(0, 3).map((item) => item.article) : KNOWLEDGE_BASE.slice(0, 3);
  const primary = topMatches[0]!;

  const intro = `Here's the most relevant information I found on HomeScope GTA for that question about ${primary.title.toLowerCase()}:`;
  const body = primary.answer.join(" ");
  const supporting =
    topMatches.length > 1
      ? `You may also want to read ${topMatches
          .slice(1)
          .map((item) => item.title)
          .join(" and ")} for related details.`
      : "Ask me a more specific question about listings, schools, market reports, neighbourhoods, leasing, buyer documents, or showing requests.";

  return {
    reply: `${intro}\n\n${body}\n\n${supporting}`,
    suggestedLinks: topMatches.map((article) => ({
      href: article.href,
      label: article.title
    }))
  };
}
