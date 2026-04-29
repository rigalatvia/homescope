import { NextResponse } from "next/server";
import { buildChatResponse } from "@/lib/chat/build-chat-response";
import { appendChatConversation } from "@/lib/chat/store";
import type { ChatRequestInput } from "@/types/chat";

function validateChatInput(input: ChatRequestInput): string[] {
  const errors: string[] = [];
  if (!input.message || !input.message.trim()) errors.push("Message is required.");
  if (input.message && input.message.trim().length > 2000) errors.push("Message is too long.");
  if (input.pagePath && !input.pagePath.startsWith("/")) errors.push("Invalid page path.");
  return errors;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ChatRequestInput;
    const errors = validateChatInput(payload);

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    }

    const response = buildChatResponse(payload.message);
    const conversation = await appendChatConversation({
      conversationId: payload.conversationId,
      pagePath: payload.pagePath,
      userAgent: request.headers.get("user-agent"),
      userMessage: payload.message.trim(),
      assistantMessage: response.reply
    });

    return NextResponse.json(
      {
        success: true,
        conversationId: conversation.id,
        reply: response.reply,
        suggestedLinks: response.suggestedLinks
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[chat] Failed to process chatbot request", error);
    return NextResponse.json(
      {
        error: "I could not answer right now. Please try again in a moment or contact info@homescopegta.ca."
      },
      { status: 500 }
    );
  }
}
