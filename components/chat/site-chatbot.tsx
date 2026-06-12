"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Loader2, MessageSquare, SendHorizontal, Sparkles, X } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import type { ChatSuggestedLink } from "@/types/chat";

interface LocalChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  suggestedLinks?: ChatSuggestedLink[];
}

const CONVERSATION_ID_KEY = "homescope-chat-conversation-id";
const MESSAGES_KEY = "homescope-chat-messages";

function buildInitialMessage(): LocalChatMessage {
  return {
    id: "chatbot-welcome",
    role: "assistant",
    content:
      "Hi, I'm the HomeScope GTA assistant. I can help with listings, city and neighbourhood pages, schools, market reports, land transfer tax, buyer/renter guides, and showing requests.",
    suggestedLinks: [
      { href: "/listings", label: "Browse Listings" },
      { href: "/schools", label: "Search Schools" },
      { href: "/guides/land-transfer-tax-calculator-ontario", label: "Land Transfer Tax Calculator" }
    ]
  };
}

function createLocalMessage(
  role: "assistant" | "user",
  content: string,
  suggestedLinks?: ChatSuggestedLink[]
): LocalChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    suggestedLinks
  };
}

const STARTER_QUESTIONS = [
  "How do I search homes near a school?",
  "Where can I see local market reports?",
  "Which neighbourhood pages are available?",
  "Estimate land transfer tax for Toronto"
];

export function SiteChatbot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalChatMessage[]>([]);
  const initializedRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isHiddenRoute = useMemo(() => pathname?.startsWith("/admin") ?? false, [pathname]);

  useEffect(() => {
    if (initializedRef.current || typeof window === "undefined") return;
    initializedRef.current = true;

    const savedConversationId = window.localStorage.getItem(CONVERSATION_ID_KEY);
    const savedMessages = window.localStorage.getItem(MESSAGES_KEY);

    if (savedConversationId) {
      setConversationId(savedConversationId);
    }

    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages) as LocalChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      } catch (error) {
        console.warn("[chat] Failed to parse saved messages", error);
      }
    }

    setMessages([buildInitialMessage()]);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || messages.length === 0) return;
    window.localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (conversationId) {
      window.localStorage.setItem(CONVERSATION_ID_KEY, conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function sendMessage(rawMessage: string) {
    const message = rawMessage.trim();
    if (!message || isSending) return;

    const nextUserMessage = createLocalMessage("user", message);
    setMessages((current) => [...current, nextUserMessage]);
    setInput("");
    setIsSending(true);
    trackEvent("chat_message_sent", { page_path: pathname || "/", message_length: message.length });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversationId || undefined,
          message,
          pagePath: pathname || "/"
        })
      });

      const payload = (await response.json()) as {
        conversationId?: string;
        reply?: string;
        suggestedLinks?: ChatSuggestedLink[];
        error?: string;
      };

      if (!response.ok || !payload.reply) {
        throw new Error(payload.error || "Chat request failed.");
      }

      if (payload.conversationId) {
        setConversationId(payload.conversationId);
      }

      setMessages((current) => [
        ...current,
        createLocalMessage("assistant", payload.reply!, payload.suggestedLinks || [])
      ]);
    } catch (error) {
      console.error("[chat] Failed to send message", error);
      setMessages((current) => [
        ...current,
        createLocalMessage(
          "assistant",
          "I couldn't answer right now. Please try again in a moment, or email info@homescopegta.ca if you need help."
        )
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleStarterQuestion(question: string) {
    setIsOpen(true);
    void sendMessage(question);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  }

  if (isHiddenRoute) return null;

  return (
    <>
      {isOpen ? (
        <div className="fixed inset-x-4 bottom-4 z-50 w-auto md:inset-x-auto md:right-6 md:w-[390px]">
          <section className="overflow-hidden rounded-[2rem] border border-brand-100 bg-white shadow-soft">
            <div className="bg-gradient-to-r from-brand-900 to-brand-700 px-5 py-4 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                    <Sparkles className="h-3.5 w-3.5" />
                    HomeScope Assistant
                  </div>
                  <h2 className="mt-3 font-heading text-2xl">Ask about listings, schools, reports, and guides</h2>
                  <p className="mt-2 text-sm leading-6 text-brand-50">
                    I can point visitors to the right HomeScope GTA page and explain what tools or next steps usually matter.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full border border-white/20 p-2 text-white transition hover:bg-white/10"
                  aria-label="Close chatbot"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[50vh] space-y-4 overflow-y-auto bg-brand-50/40 px-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "bg-brand-900 text-white"
                        : "border border-brand-100 bg-white text-brand-800"
                    }`}
                  >
                    <p className="whitespace-pre-line">{message.content}</p>
                    {message.suggestedLinks && message.suggestedLinks.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.suggestedLinks.map((link) => (
                          <Link
                            key={`${message.id}-${link.href}`}
                            href={link.href}
                            className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 transition hover:border-brand-400 hover:bg-white"
                          >
                            {link.label}
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}

              {isSending ? (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-3xl border border-brand-100 bg-white px-4 py-3 text-sm text-brand-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Looking through the site...
                  </div>
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-brand-100 bg-white px-4 py-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {STARTER_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => handleStarterQuestion(question)}
                    className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-800 transition hover:border-brand-400 hover:bg-brand-50"
                  >
                    {question}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <label className="sr-only" htmlFor="site-chatbot-message">
                  Ask HomeScope GTA a question
                </label>
                <textarea
                  id="site-chatbot-message"
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  placeholder="Ask about listings, schools, market reports, taxes, or showings..."
                  className="min-h-[64px] flex-1 resize-none rounded-2xl border border-brand-200 px-4 py-3 text-sm text-brand-900 outline-none transition focus:border-brand-400"
                />
                <button
                  type="button"
                  onClick={() => void sendMessage(input)}
                  disabled={isSending || !input.trim()}
                  className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-900 text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Send message"
                >
                  <SendHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {!isOpen ? (
        <div className="fixed bottom-5 right-5 z-50">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-3 rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-800"
            aria-label="Open HomeScope GTA assistant"
          >
            <MessageSquare className="h-4 w-4" />
            Ask HomeScope
          </button>
        </div>
      ) : null}
    </>
  );
}
