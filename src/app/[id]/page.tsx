// ───────────────────────────────────────────────────────────────────────────────
// Chat Page: Thin composition layer using compound components
// ───────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import {
  ChatConversationArea,
  ChatFrame,
  ChatInputArea,
  ChatProvider,
} from "@/components/chat";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Chat ${id} - Open TA Tel-U`,
    description:
      "AI-powered research assistant for Telkom University alumni papers",
  };
}

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id } = await params;
  const { q } = await searchParams;

  console.log("[ChatPage] Received params:", { id, q });

  return (
    <ChatProvider conversationId={id} initialWebSearch={false} initialQuery={q}>
      <ChatFrame>
        <ChatConversationArea />
        <ChatInputArea />
      </ChatFrame>
    </ChatProvider>
  );
}
