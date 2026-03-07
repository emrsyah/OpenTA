"use client";

import { nanoid } from "nanoid";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import {
  ActiveFilterTags,
  type ChatFilters,
  FilterPanel,
  QuickFilterChips,
} from "@/components/chat";
import { SuggestionChips } from "@/components/suggestion-chips";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { authClient, signInGoogle } from "@/lib/auth/client";

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments();

  if (attachments.files.length === 0) {
    return null;
  }

  return (
    <Attachments variant="inline">
      {attachments.files.map((attachment) => (
        <Attachment
          data={attachment}
          key={attachment.id}
          onRemove={() => attachments.remove(attachment.id)}
        >
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  );
};

export function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = authClient.useSession();
  const [text, setText] = useState<string>("");
  const [filters, setFilters] = useState<ChatFilters>({});

  // Handle error parameters from redirects
  useEffect(() => {
    const error = searchParams.get("error");

    if (error === "conversation_not_found") {
      toast.error("Conversation not found", {
        description:
          "The conversation you're looking for doesn't exist or has been deleted.",
        id: "conversation-not-found",
      });

      // Clean up URL by removing the error parameter
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [searchParams]);

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    // Check authentication
    if (isPending) {
      // Still loading session, show loading toast
      toast.loading("Checking authentication...", {
        id: "auth-check",
      });
      return;
    }

    if (!session?.user) {
      // User is not authenticated, show toast with login action
      toast.error("Please sign in to send messages", {
        id: "auth-required",
        action: {
          label: "Sign in with Google",
          onClick: () => {
            toast.dismiss("auth-required");
            signInGoogle();
          },
        },
      });
      return;
    }

    // Generate a new conversation ID (UUID)
    // Backend will handle database persistence when processing the message
    const conversationId = nanoid();
    const params = new URLSearchParams();
    if (message.text) params.set("q", message.text);

    // Pass filters through URL params if any are set
    if (Object.keys(filters).length > 0) {
      params.set("filters", JSON.stringify(filters));
    }

    router.push(`/${conversationId}?${params.toString()}`);
  };

  const handleSuggestionClick = (suggestionText: string) => {
    setText(suggestionText);
  };

  const clearFilters = () => setFilters({});

  const hasActiveFilters = !!(
    filters.catalogType ||
    filters.yearFrom ||
    filters.yearTo ||
    filters.author ||
    filters.hasElectronicAccess
  );

  return (
    <>
      <AnnouncementBanner />
      <div className="flex md:mx-4 flex-col h-[calc(100vh-2rem)]">
      <Conversation className="flex-1 overflow-hidden">
        <ConversationContent>
          <div className="flex flex-col items-center justify-center h-full px-4 animate-in mt-16 fade-in slide-in-from-bottom-4 duration-1000">
            {/* Logo Section */}
            <div className="mb-10 relative">
              <div className="absolute -inset-8 bg-primary/10 rounded-full blur-3xl animate-pulse" />
              <div className="relative z-10 flex items-center justify-center bg-background border rounded-3xl p-2 shadow-2xl">
                <Image
                  src="/favicon/android-chrome-192x192.png"
                  alt="OpenTA Logo"
                  width={80}
                  height={80}
                  className="w-20 h-20 drop-shadow-sm"
                />
              </div>
            </div>

            {/* Welcome Message */}
            <div className="text-center max-w-2xl space-y-6">
              <h1 className="text-5xl font-extrabold tracking-tight bg-linear-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                OpenTA
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Search, ask, and discover insights from academic papers.
              </p>
            </div>

            {/* Suggestion Chips */}
            <div className="w-full max-w-2xl mt-12">
              <SuggestionChips onSelect={handleSuggestionClick} />
            </div>
          </div>
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="px-4 py-3 max-w-4xl mx-auto w-full">
        {/* Active Filter Tags */}
        {hasActiveFilters && (
          <div className="mb-3">
            <ActiveFilterTags filters={filters} onChange={setFilters} />
          </div>
        )}

        {/* Quick Filter Chips */}
        {/* <div className="mb-3">
          <QuickFilterChips filters={filters} onChange={setFilters} />
        </div> */}

        <PromptInput
          onSubmit={handleSubmit}
          className="w-full"
          globalDrop
          multiple
        >
          <PromptInputHeader>
            <PromptInputAttachmentsDisplay />
          </PromptInputHeader>
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setText(e.target.value)
              }
              value={text}
              placeholder="Type your message..."
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <FilterPanel
                filters={filters}
                onChange={setFilters}
                onClear={clearFilters}
              />
            </PromptInputTools>
            <PromptInputSubmit disabled={!text} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
    </>
  );
}
