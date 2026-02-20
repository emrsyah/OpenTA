"use client";

import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
import {
  InlineCitation,
  InlineCitationCard,
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
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import {
  Task,
  TaskContent,
  TaskItem,
  TaskTrigger,
} from "@/components/ai-elements/task";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Badge } from "@/components/ui/badge";
import { HoverCardTrigger } from "@/components/ui/hover-card";
import type { ChatMessage as ChatMessageType, PlanStep, Source as SourceType } from "@/hooks/use-streaming-chat";
import { useStreamingChat } from "@/hooks/use-streaming-chat";
import {
  CheckIcon,
  GlobeIcon,
  Loader2Icon,
  SearchIcon,
} from "lucide-react";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

// ─── Inline citation rendering ────────────────────────────────────────────────

const CitationHoverCard = ({
  nums,
  sources,
}: {
  nums: number[];
  sources: SourceType[];
}) => (
  <InlineCitation>
    <InlineCitationCard>
      <HoverCardTrigger asChild>
        <Badge
          className="mx-0.5 cursor-pointer rounded-full align-middle text-xs"
          variant="secondary"
        >
          {nums.join(", ")}
        </Badge>
      </HoverCardTrigger>
      <InlineCitationCardBody>
        <InlineCitationCarousel>
          <InlineCitationCarouselHeader>
            <InlineCitationCarouselPrev />
            <InlineCitationCarouselIndex />
            <InlineCitationCarouselNext />
          </InlineCitationCarouselHeader>
          <InlineCitationCarouselContent>
            {sources.map((s) => (
              <InlineCitationCarouselItem key={s.id}>
                <InlineCitationSource title={s.title} description={s.abstract}>
                  <p className="text-muted-foreground text-xs">
                    {s.authors.slice(0, 3).join(", ")}
                    {s.authors.length > 3 ? " et al." : ""} &bull; {s.year}
                  </p>
                </InlineCitationSource>
              </InlineCitationCarouselItem>
            ))}
          </InlineCitationCarouselContent>
        </InlineCitationCarousel>
      </InlineCitationCardBody>
    </InlineCitationCard>
  </InlineCitation>
);

const CITATION_RE = /\[(\d+(?:,\s*\d+)*)\]/g;

function processTextForCitations(
  text: string,
  sourceMap: Map<number, SourceType>,
): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  CITATION_RE.lastIndex = 0;

  while ((match = CITATION_RE.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const nums = match[1].split(",").map((n) => parseInt(n.trim(), 10));
    const matched = nums.map((n) => sourceMap.get(n)).filter((s): s is SourceType => !!s);
    if (matched.length > 0) {
      parts.push(<CitationHoverCard key={match.index} nums={nums} sources={matched} />);
    } else {
      parts.push(match[0]);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function processChildren(children: ReactNode, sourceMap: Map<number, SourceType>): ReactNode {
  if (typeof children === "string") return processTextForCitations(children, sourceMap);
  if (Array.isArray(children)) {
    return children.map((child, i) =>
      typeof child === "string"
        ? processTextForCitations(child, sourceMap).map((p, j) =>
            typeof p === "string" ? p : <span key={`${i}-${j}`}>{p}</span>,
          )
        : child,
    );
  }
  return children;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeCitationComponents(sourceMap: Map<number, SourceType>): any {
  return {
    p: ({ children, node: _n, ...props }: { children?: ReactNode; node?: unknown } & Record<string, unknown>) => (
      <p {...props}>{processChildren(children ?? null, sourceMap)}</p>
    ),
    li: ({ children, node: _n, ...props }: { children?: ReactNode; node?: unknown } & Record<string, unknown>) => (
      <li {...props}>{processChildren(children ?? null, sourceMap)}</li>
    ),
  };
}

// ─── Research panel (Task-based) ──────────────────────────────────────────────

const StepIcon = ({ status }: { status: PlanStep["status"] }) => {
  if (status === "done") return <CheckIcon className="size-3.5 text-primary" />;
  if (status === "active") return <Loader2Icon className="size-3.5 animate-spin" />;
  return <span className="inline-block size-3.5 rounded-full border border-muted-foreground/30" />;
};

const MessageResearchPanel = ({
  message,
  isStreaming,
}: {
  message: ChatMessageType;
  isStreaming: boolean;
}) => {
  const { classifyStatus, planSteps, answerStarted } = message;
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (answerStarted) setOpen(false);
  }, [answerStarted]);

  const hasContent = classifyStatus || planSteps?.length;
  if (!hasContent) return null;

  const isPlanRunning = isStreaming && !answerStarted;
  const stepCount = planSteps?.length ?? 0;
  const doneCount = planSteps?.filter((s) => s.status === "done").length ?? 0;
  const allDone = doneCount === stepCount && stepCount > 0;

  const label = isPlanRunning
    ? planSteps
      ? `Researching… ${doneCount}/${stepCount} steps`
      : "Planning research…"
    : allDone
      ? `Research complete · ${stepCount} steps`
      : "Research";

  return (
    <Task className="mb-3" open={open} onOpenChange={setOpen}>
      <TaskTrigger title={label}>
        <div className="flex w-full cursor-pointer items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground group">
          {isPlanRunning ? (
            <Loader2Icon className="size-4 animate-spin shrink-0" />
          ) : (
            <CheckIcon className="size-4 shrink-0 text-primary" />
          )}
          <p className="flex-1 text-sm">{label}</p>
          <span className="size-4 transition-transform group-data-[state=open]:rotate-180 shrink-0">
            ▾
          </span>
        </div>
      </TaskTrigger>
      <TaskContent>
        {/* Pre-plan status */}
        {!planSteps && classifyStatus && (
          <TaskItem className="flex items-center gap-2">
            <Loader2Icon className="size-3 animate-spin shrink-0" />
            {classifyStatus === "classifying"
              ? "Classifying request…"
              : classifyStatus === "classified"
                ? "Request classified"
                : "Planning research…"}
          </TaskItem>
        )}

        {/* Per-step tasks */}
        {planSteps?.map((step) => (
          <Task
            className="w-full"
            defaultOpen={step.status === "active"}
            key={step.id}
          >
            <TaskTrigger title={step.title}>
              <div className="flex w-full cursor-pointer items-center gap-2 text-sm transition-colors hover:text-foreground group">
                <StepIcon status={step.status} />
                <span
                  className={
                    step.status === "pending"
                      ? "text-muted-foreground/40"
                      : step.status === "active"
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                  }
                >
                  {step.title}
                </span>
                {(step.thinking || step.searchQuery) && (
                  <span className="ml-auto size-3.5 transition-transform group-data-[state=open]:rotate-180 shrink-0 text-muted-foreground">
                    ▾
                  </span>
                )}
              </div>
            </TaskTrigger>
            {(step.searchQuery || step.thinking) && (
              <TaskContent>
                {step.searchQuery && (
                  <TaskItem className="flex items-center gap-1.5 text-xs">
                    <SearchIcon className="size-3 shrink-0" />
                    <span className="italic truncate">{step.searchQuery}</span>
                    {step.paperCount !== undefined && (
                      <span className="shrink-0 text-muted-foreground">
                        · {step.paperCount} papers
                      </span>
                    )}
                  </TaskItem>
                )}
                {step.thinking && (
                  <TaskItem className="whitespace-pre-wrap text-xs leading-relaxed">
                    {step.thinking}
                  </TaskItem>
                )}
              </TaskContent>
            )}
          </Task>
        ))}
      </TaskContent>
    </Task>
  );
};

// ─── Sources (collapsible) ─────────────────────────────────────────────────────

const MessageSources = ({ sources }: { sources: SourceType[] }) => {
  if (sources.length === 0) return null;

  const grouped = sources.reduce<Record<number, SourceType[]>>((acc, s) => {
    if (!acc[s.citation_number]) acc[s.citation_number] = [];
    acc[s.citation_number].push(s);
    return acc;
  }, {});
  const sorted = Object.values(grouped).sort(
    (a, b) => a[0].citation_number - b[0].citation_number,
  );

  return (
    <Sources className="mt-4 border-t border-border pt-3 not-prose text-foreground">
      <SourcesTrigger count={sorted.length} className="text-muted-foreground hover:text-foreground transition-colors" />
      <SourcesContent className="w-full mt-2 gap-1.5">
        {sorted.map((group) => {
          const primary = group[0];
          return (
            <InlineCitation key={primary.citation_number}>
              <InlineCitationCard>
                <HoverCardTrigger asChild>
                  <Source className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    <Badge
                      className="rounded-full shrink-0 text-xs font-mono"
                      variant="secondary"
                    >
                      {primary.citation_number}
                    </Badge>
                    <span className="text-xs truncate max-w-64">{primary.title}</span>
                    <span className="text-xs text-muted-foreground/60 shrink-0 ml-auto">
                      {primary.year}
                    </span>
                  </Source>
                </HoverCardTrigger>
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
                          <InlineCitationSource title={s.title} description={s.abstract}>
                            <p className="text-muted-foreground text-xs">
                              {s.authors.slice(0, 3).join(", ")}
                              {s.authors.length > 3 ? " et al." : ""} &bull; {s.year}
                            </p>
                          </InlineCitationSource>
                        </InlineCitationCarouselItem>
                      ))}
                    </InlineCitationCarouselContent>
                  </InlineCitationCarousel>
                </InlineCitationCardBody>
              </InlineCitationCard>
            </InlineCitation>
          );
        })}
      </SourcesContent>
    </Sources>
  );
};

// ─── Attachments display ──────────────────────────────────────────────────────

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments();
  if (attachments.files.length === 0) return null;
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

// ─── Page ─────────────────────────────────────────────────────────────────────

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
  const [model] = useState<string>(models[0].id);
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
    if (!message.text && !message.files?.length) return;
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
              <MessageEntry
                key={message.id}
                message={message}
                isStreaming={status === "streaming"}
              />
            ))}
          </div>
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="px-4 py-3 max-w-4xl mx-auto w-full">
        <PromptInput onSubmit={handleSubmit} className="w-full" globalDrop multiple>
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

// Extracted so useMemo runs per-message (avoids creating new components on every parent render)
function MessageEntry({
  message,
  isStreaming,
}: {
  message: ChatMessageType;
  isStreaming: boolean;
}) {
  const citationComponents = useMemo(() => {
    if (!message.sources?.length) return undefined;
    const sourceMap = new Map(message.sources.map((s) => [s.citation_number, s]));
    return makeCitationComponents(sourceMap);
  }, [message.sources]);

  return (
    <Message from={message.role}>
      <MessageContent>
        {message.role === "assistant" && (
          <MessageResearchPanel isStreaming={isStreaming} message={message} />
        )}
        {message.parts.map((part, i) => {
          if (part.type !== "text") return null;
          return (
            <MessageResponse
              key={citationComponents ? `cited-${message.id}-${i}` : `${message.id}-${i}`}
              components={citationComponents}
            >
              {part.text}
            </MessageResponse>
          );
        })}
        {message.role === "assistant" && !!message.sources?.length && (
          <MessageSources sources={message.sources} />
        )}
      </MessageContent>
    </Message>
  );
}
