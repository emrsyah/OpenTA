import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import type {
  ChatMessage as ChatMessageType,
  Source,
} from "@/hooks/use-streaming-chat";
import { CitationHoverCard } from "./citation-hover-card";
import { MessageResearchPanel } from "./message-research-panel";
import { MessageSources } from "./message-sources";

interface MessageEntryProps {
  message: ChatMessageType;
  isStreaming: boolean;
}

/**
 * Process children to handle citations in markdown content
 * This replaces citation markers with CitationHoverCard components
 */
function processChildren(
  children: ReactNode,
  sourceMap: Map<number, Source>,
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

      // Add citation card if sources found
      if (matched.length > 0) {
        parts.push(
          <CitationHoverCard key={match.index} nums={nums} sources={matched} />,
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
        const processed = processChildren(child, sourceMap);
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
function makeCitationComponents(sourceMap: Map<number, Source>): any {
  return {
    p: ({
      children,
      node: _n,
      ...props
    }: {
      children?: ReactNode;
      node?: unknown;
    } & Record<string, unknown>) => (
      <p {...props}>{processChildren(children ?? null, sourceMap)}</p>
    ),
    li: ({
      children,
      node: _n,
      ...props
    }: {
      children?: ReactNode;
      node?: unknown;
    } & Record<string, unknown>) => (
      <li {...props}>{processChildren(children ?? null, sourceMap)}</li>
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
    return makeCitationComponents(sourceMap);
  }, [message.sources]);

  return (
    <Message from={message.role}>
      <MessageContent>
        {message.role === "assistant" && (
          <MessageResearchPanel isStreaming={isStreaming} message={message} />
        )}
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
