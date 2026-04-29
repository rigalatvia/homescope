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
    title: "Lease Documents for Ontario Rentals",
    href: "/guides/lease-documents",
    keywords: ["lease documents", "proof of income", "credit report", "employment letter", "references"],
    summary: "Lists the core documents renters often gather before applying for a lease in Ontario.",
    answer: [
      "For Ontario rentals, many landlords want supporting documents such as ID, proof of income, employment confirmation, credit-related records, and references.",
      "HomeScope GTA also has a lease documents guide so renters can see the checklist before they start booking showings."
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

  const intro = `Here’s the most relevant information I found on HomeScope GTA for that question about ${primary.title.toLowerCase()}:`;
  const body = primary.answer.join(" ");
  const supporting =
    topMatches.length > 1
      ? `You may also want to read ${topMatches
          .slice(1)
          .map((item) => item.title)
          .join(" and ")} for related details.`
      : "If you want, ask me a more specific question about leasing, rental forms, buyer documents, or showing requests.";

  return {
    reply: `${intro}\n\n${body}\n\n${supporting}`,
    suggestedLinks: topMatches.map((article) => ({
      href: article.href,
      label: article.title
    }))
  };
}
