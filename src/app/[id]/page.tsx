// ───────────────────────────────────────────────────────────────────────────────
// Chat Page: Thin composition layer using compound components
// ───────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ChatConversationArea,
  type ChatFilters,
  ChatFrame,
  ChatInputArea,
  ChatProvider,
  type SourceType,
} from "@/components/chat";
import { getConversationById } from "@/lib/db/conversations";

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
  searchParams: Promise<{ q?: string; sources?: string; filters?: string }>;
}) {
  const { id } = await params;
  const { q, sources, filters } = await searchParams;

  // Parse filters from URL if present
  let initialFilters: ChatFilters | undefined;
  if (filters) {
    try {
      initialFilters = JSON.parse(filters) as ChatFilters;
    } catch {
      // Invalid JSON, ignore filters
      initialFilters = undefined;
    }
  }

  // Validate conversation exists
  // Note: New conversations with an initial query (q) are allowed
  // The conversation is created in the database when the first message is processed
  const conversation = await getConversationById(id);

  // If conversation doesn't exist and there's no initial query,
  // this is an invalid conversation ID (e.g., user typed random URL)
  if (!conversation && !q) {
    redirect("/?error=conversation_not_found");
  }

  // Parse source types from URL parameter
  const initialSourceTypes: SourceType[] = sources
    ? (sources.split(",") as SourceType[])
    : ["all"];

  return (
    <div className="px-4">
      <ChatProvider
        conversationId={id}
        initialWebSearch={false}
        initialQuery={q}
        initialSourceTypes={initialSourceTypes}
        initialFilters={initialFilters}
      >
        <ChatFrame>
          <ChatConversationArea />
          <ChatInputArea />
        </ChatFrame>
      </ChatProvider>
    </div>
  );
}
