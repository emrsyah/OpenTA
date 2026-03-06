import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export async function getAllConversations(limit = 50) {
  return db
    .select()
    .from(conversations)
    .orderBy(desc(conversations.updatedAt))
    .limit(limit);
}

export async function getConversationsByUserId(
  userId: string,
  limit = 20,
  offset = 0,
) {
  return db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt))
    .limit(limit)
    .offset(offset);
}

export async function getConversationById(id: string) {
  const result = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id))
    .limit(1);

  return result[0] || null;
}

export async function getMessagesByConversationId(conversationId: string) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
}

// Create a conversation with required userId
export async function createConversation(
  data: Omit<NewConversation, "userId"> & { userId: string },
) {
  const result = await db
    .insert(conversations)
    .values(data as NewConversation)
    .returning();
  return result[0];
}

export async function deleteConversation(id: string) {
  const result = await db
    .delete(conversations)
    .where(eq(conversations.id, id))
    .returning();

  return result[0] || null;
}

export async function getConversationWithMessages(id: string) {
  const conversation = await getConversationById(id);
  if (!conversation) return null;

  const conversationMessages = await getMessagesByConversationId(id);

  return { ...conversation, messages: conversationMessages };
}
