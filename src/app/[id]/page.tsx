// ───────────────────────────────────────────────────────────────────────────────
// Chat Page: Thin composition layer using compound components
// ───────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import {
  ChatConversationArea,
  ChatFrame,
  ChatInputArea,
  ChatProvider,
  type SourceType,
} from "@/components/chat";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { q } = await searchParams;

  const title = q || `Chat ${id}`;

  return {
    title: {
      absolute: `${title} - OpenTa`,
    },
    description:
      "AI-powered research assistant for Telkom University alumni papers",
  };
}

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; sources?: string }>;
}) {
  const { id } = await params;
  const { q, sources } = await searchParams;

  // Parse source types from URL parameter
  const initialSourceTypes: SourceType[] = sources
    ? (sources.split(",") as SourceType[])
    : ["all"];

  console.log("[ChatPage] Received params:", {
    id,
    q,
    sources,
    initialSourceTypes,
  });

  return (
    <ChatProvider
      conversationId={id}
      initialWebSearch={false}
      initialQuery={q}
      initialSourceTypes={initialSourceTypes}
    >
      <ChatFrame>
        <ChatConversationArea />
        <ChatInputArea />
      </ChatFrame>
    </ChatProvider>
  );
}
