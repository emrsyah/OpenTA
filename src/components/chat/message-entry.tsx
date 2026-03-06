import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  Message,
  MessageContent,
  MessageCopyButton,
  MessageResponse,
} from "@/components/ai-elements/message";
import type {
  ChatMessage as ChatMessageType,
  CitationAuditResult,
  Source,
} from "@/hooks/use-streaming-chat";
import { CitationHoverCard } from "./citation-hover-card";
import { MessageRefinementIndicator } from "./message-refinement-indicator";
import { MessageResearchPanel } from "./message-research-panel";
import { MessageSources } from "./message-sources";

interface MessageEntryProps {
  message: ChatMessageType;
  isStreaming: boolean;
}

/**
 * Extract plain text content from message parts for copying
 */
function extractTextContent(message: ChatMessageType): string {
  const texts: string[] = [];

  // Add acknowledgment if present (assistant messages)
  if (message.acknowledgment) {
    texts.push(message.acknowledgment);
  }

  // Add all text parts
  for (const part of message.parts) {
    if (part.type === "text") {
      texts.push(part.text);
    }
  }

  return texts.join("\n\n");
}

/**
 * Process children to handle citations in markdown content
 * This replaces citation markers with CitationHoverCard components
 */
function processChildren(
  children: ReactNode,
  sourceMap: Map<number, Source>,
  citationAudit?: CitationAuditResult,
): ReactNode {
  if (typeof children === "string") {
    // Process string for citations
    const CITATION_RE = /\[(\d+(?:,\s*\d+)*)\]/g;
    const parts: ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = CITATION_RE.exec(children)) !== null) {
      // Add text before citation
      if (match.index > lastIndex) {
        parts.push(children.slice(lastIndex, match.index));
      }

      // Parse citation numbers and find sources
      const nums = match[1].split(",").map((n) => parseInt(n.trim(), 10));
      const matched = nums
        .map((n) => sourceMap.get(n))
        .filter((s): s is Source => !!s);

      // Check if citation is invalid (hallucinated)
      const isInvalid =
        citationAudit &&
        !citationAudit.isClean &&
        citationAudit.hallucinatedNumbers.includes(nums[0]);

      // Add citation card if sources found OR if citation is invalid
      if (matched.length > 0 || isInvalid) {
        parts.push(
          <CitationHoverCard
            key={match.index}
            nums={nums}
            sources={matched}
            citationAudit={citationAudit}
          />,
        );
      } else {
        parts.push(match[0]);
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < children.length) {
      parts.push(children.slice(lastIndex));
    }

    return parts;
  }

  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === "string") {
        const processed = processChildren(child, sourceMap, citationAudit);
        if (Array.isArray(processed)) {
          return processed.map((p, j) =>
            typeof p === "string" ? p : <span key={`${i}-${j}`}>{p}</span>,
          );
        }
        return processed;
      }
      return child;
    });
  }

  return children;
}

/**
 * Create citation component map for markdown rendering
 * This is passed to MessageResponse component
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeCitationComponents(
  sourceMap: Map<number, Source>,
  citationAudit?: CitationAuditResult,
): any {
  return {
    p: ({
      children,
      node: _n,
      ...props
    }: {
      children?: ReactNode;
      node?: unknown;
    } & Record<string, unknown>) => (
      <p {...props}>
        {processChildren(children ?? null, sourceMap, citationAudit)}
      </p>
    ),
    li: ({
      children,
      node: _n,
      ...props
    }: {
      children?: ReactNode;
      node?: unknown;
    } & Record<string, unknown>) => (
      <li {...props}>
        {processChildren(children ?? null, sourceMap, citationAudit)}
      </li>
    ),
  };
}

/**
 * Message entry component that renders a single chat message
 * Displays research panel, message content with citations, and sources
 *
 * Extracted as separate component to avoid creating new components on every parent render
 */
export function MessageEntry({ message, isStreaming }: MessageEntryProps) {
  const citationComponents = useMemo(() => {
    if (!message.sources?.length) {
      return undefined;
    }
    const sourceMap = new Map(
      message.sources.map((s) => [s.citation_number, s]),
    );
    return makeCitationComponents(sourceMap, message.citationAudit);
  }, [message.sources, message.citationAudit]);

  // Extract text for copy button
  const textContent = useMemo(() => extractTextContent(message), [message]);

  // Check if answer is being refined
  const isRefining =
    message.refinementState === "streaming" ||
    message.refinementState === "searching";

  return (
    <Message from={message.role}>
      <MessageContent>
        {/* Render acknowledgment FIRST (before research panel) */}
        {/* This ensures correct DOM order: shimmer → acknowledgment → task panel → answer */}
        {message.role === "assistant" && message.acknowledgment && (
          <div className="mb-3 text-foreground text-sm leading-relaxed">
            {message.acknowledgment}
          </div>
        )}
        {message.role === "assistant" && (
          <MessageResearchPanel isStreaming={isStreaming} message={message} />
        )}

        {/* Refinement indicator - appears between research panel and answer */}
        {message.role === "assistant" && message.refinementState && (
          <MessageRefinementIndicator
            refinementState={message.refinementState}
          />
        )}

        {/* Answer content with subtle pulse during refinement */}
        <div
          className={
            isRefining
              ? "animate-pulse rounded-lg border border-primary/20 bg-primary/5 p-1 -m-1"
              : undefined
          }
        >
          {message.parts.map((part, i) => {
            if (part.type !== "text") {
              return null;
            }
            return (
              <MessageResponse
                key={
                  citationComponents
                    ? `cited-${message.id}-${i}`
                    : `${message.id}-${i}`
                }
                components={citationComponents}
                refinementState={message.refinementState}
              >
                {part.text}
              </MessageResponse>
            );
          })}
        </div>

        {message.role === "assistant" && !!message.sources?.length && (
          <MessageSources sources={message.sources} />
        )}
      </MessageContent>
      {/* Copy button - only show when not streaming */}
      {!isStreaming && textContent && (
        <div className="flex justify-end mt-1">
          <MessageCopyButton content={textContent} />
        </div>
      )}
    </Message>
  );
}
