import { randomUUID } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { ChatConversationDocument, ChatMessageRecord } from "@/types/chat";

const CHAT_CONVERSATIONS_COLLECTION = "chatConversations";

interface AppendChatConversationInput {
  conversationId?: string;
  pagePath?: string;
  userAgent?: string | null;
  userMessage: string;
  assistantMessage: string;
}

function normalizePagePath(pagePath?: string): string | null {
  const trimmed = (pagePath || "").trim();
  if (!trimmed.startsWith("/")) return null;
  return trimmed;
}

function buildMessage(role: ChatMessageRecord["role"], content: string): ChatMessageRecord {
  return {
    id: randomUUID(),
    role,
    content,
    createdAt: new Date().toISOString()
  };
}

export async function appendChatConversation(
  input: AppendChatConversationInput
): Promise<ChatConversationDocument> {
  const firestore = getFirebaseAdminFirestore();
  const docRef = input.conversationId
    ? firestore.collection(CHAT_CONVERSATIONS_COLLECTION).doc(input.conversationId)
    : firestore.collection(CHAT_CONVERSATIONS_COLLECTION).doc();
  const nowIso = new Date().toISOString();
  const normalizedPagePath = normalizePagePath(input.pagePath);
  const userMessage = buildMessage("user", input.userMessage);
  const assistantMessage = buildMessage("assistant", input.assistantMessage);

  const conversation = await firestore.runTransaction(async (transaction) => {
    const existingSnapshot = await transaction.get(docRef);
    const existing = existingSnapshot.exists
      ? (existingSnapshot.data() as ChatConversationDocument)
      : null;

    const pagePaths = Array.from(
      new Set([...(existing?.pagePaths ?? []), ...(normalizedPagePath ? [normalizedPagePath] : [])])
    );
    const messages = [...(existing?.messages ?? []), userMessage, assistantMessage];

    const record: ChatConversationDocument = {
      id: docRef.id,
      createdAt: existing?.createdAt ?? nowIso,
      updatedAt: nowIso,
      source: "website",
      pagePaths,
      userAgent: existing?.userAgent ?? input.userAgent ?? null,
      messages
    };

    const writePayload: Record<string, unknown> = {
      ...record,
      updatedAtServer: FieldValue.serverTimestamp()
    };

    if (!existing) {
      writePayload.createdAtServer = FieldValue.serverTimestamp();
    }

    transaction.set(
      docRef,
      writePayload,
      { merge: true }
    );

    return record;
  });

  return conversation;
}
