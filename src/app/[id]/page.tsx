"use client";

import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { GlobeIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState, useEffect, useRef, use } from "react";
import { useSearchParams } from "next/navigation";
import { useStreamingChat } from "@/hooks/use-streaming-chat";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  InlineCitationCardBody,
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselHeader,
  InlineCitationCarouselIndex,
  InlineCitationCarouselItem,
  InlineCitationCarouselNext,
  InlineCitationCarouselPrev,
  InlineCitationSource,
} from "@/components/ai-elements/inline-citation";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import type { Source } from "@/hooks/use-streaming-chat";

const MessageRationale = ({ rationale }: { rationale: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-3 rounded-md border border-border text-sm">
      <button
        className="flex w-full items-center justify-between px-3 py-2 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span className="font-medium">Reasoning</span>
        {open ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
      </button>
      {open && (
        <div className="border-t border-border px-3 py-2 text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap">
          {rationale}
        </div>
      )}
    </div>
  );
};

const MessageSources = ({ sources }: { sources: Source[] }) => {
  if (sources.length === 0) return null;

  const grouped = sources.reduce<Record<number, Source[]>>((acc, s) => {
    const key = s.citation_number;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const sorted = Object.values(grouped).sort(
    (a, b) => a[0].citation_number - b[0].citation_number,
  );

  return (
    <div className="mt-4 border-t border-border pt-3 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        References
      </p>
      <div className="space-y-1">
        {sorted.map((group) => {
          const num = group[0].citation_number;
          return (
            <div key={num} className="flex items-start gap-2">
              <HoverCard closeDelay={0} openDelay={0}>
                <HoverCardTrigger asChild>
                  <Badge
                    className="mt-0.5 shrink-0 cursor-pointer rounded-full"
                    variant="secondary"
                  >
                    {num}
                  </Badge>
                </HoverCardTrigger>
                <HoverCardContent className="w-80 p-0">
                  <InlineCitationCardBody>
                    <InlineCitationCarousel>
                      <InlineCitationCarouselHeader>
                        <InlineCitationCarouselPrev />
                        <InlineCitationCarouselIndex />
                        <InlineCitationCarouselNext />
                      </InlineCitationCarouselHeader>
                      <InlineCitationCarouselContent>
                        {group.map((s) => (
                          <InlineCitationCarouselItem key={s.id}>
                            <InlineCitationSource
                              title={s.title}
                              description={s.abstract}
                            >
                              <p className="text-muted-foreground text-xs">
                                {s.authors.slice(0, 3).join(", ")}
                                {s.authors.length > 3 ? " et al." : ""} &bull;{" "}
                                {s.year}
                              </p>
                            </InlineCitationSource>
                          </InlineCitationCarouselItem>
                        ))}
                      </InlineCitationCarouselContent>
                    </InlineCitationCarousel>
                  </InlineCitationCardBody>
                </HoverCardContent>
              </HoverCard>
              <p className="text-xs text-foreground leading-relaxed pt-0.5">
                {group[0].title}{" "}
                <span className="text-muted-foreground">
                  — {group[0].authors.slice(0, 2).join(", ")}
                  {group[0].authors.length > 2 ? " et al." : ""},{" "}
                  {group[0].year}
                </span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

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

const models = [
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "claude-opus-4-20250514", name: "Claude 4 Opus" },
];

export default function ChatPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = use(params);
  const searchParams = useSearchParams();
  const [text, setText] = useState<string>("");
  const [model, setModel] = useState<string>(models[0].id);
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);

  const { messages, status, sendMessage } = useStreamingChat();
  const initialSentRef = useRef(false);

  useEffect(() => {
    if (initialSentRef.current) return;
    const initialQuery = searchParams.get("q");
    if (initialQuery) {
      initialSentRef.current = true;
      sendMessage(initialQuery, {
        body: { conversationId, model, webSearch: useWebSearch },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    sendMessage(message.text || "Sent with attachments", {
      body: { conversationId, model, webSearch: useWebSearch },
    });
    setText("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      <Conversation className="flex-1 overflow-hidden">
        <ConversationContent>
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
            {messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.role === "assistant" && message.rationale && (
                    <MessageRationale rationale={message.rationale} />
                  )}
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <MessageResponse key={`${message.id}-${i}`}>
                            {part.text}
                          </MessageResponse>
                        );
                      default:
                        return null;
                    }
                  })}
                  {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                    <MessageSources sources={message.sources} />
                  )}
                </MessageContent>
              </Message>
            ))}
          </div>
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="px-4 py-3 max-w-4xl mx-auto w-full">
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
              onChange={(e) => setText(e.target.value)}
              value={text}
              placeholder="Type your message..."
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
              <PromptInputButton
                onClick={() => setUseWebSearch(!useWebSearch)}
                tooltip={{ content: "Search the web", shortcut: "⌘K" }}
                variant={useWebSearch ? "default" : "ghost"}
                type="button"
              >
                <GlobeIcon size={16} />
                <span>Deep Research</span>
              </PromptInputButton>
            </PromptInputTools>
            <PromptInputSubmit
              disabled={!text && status !== "streaming"}
              status={status}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
