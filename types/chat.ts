export type ChatMessageRole = "user" | "assistant";

export interface ChatMessageRecord {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
}

export interface ChatSuggestedLink {
  href: string;
  label: string;
}

export interface ChatConversationDocument {
  id: string;
  createdAt: string;
  updatedAt: string;
  source: "website";
  pagePaths: string[];
  userAgent: string | null;
  messages: ChatMessageRecord[];
}

export interface ChatRequestInput {
  conversationId?: string;
  message: string;
  pagePath?: string;
}
