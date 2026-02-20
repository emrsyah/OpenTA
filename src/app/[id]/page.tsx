"use client";

import { GlobeIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
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
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { MessageEntry, PromptInputAttachmentsDisplay } from "@/components/chat";
import { useStreamingChat } from "@/hooks/use-streaming-chat";

// ─── Chat Models ─────────────────────────────────────────────────────────────

const models = [
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "claude-opus-4-20250514", name: "Claude 4 Opus" },
];

// ─── Chat Page ───────────────────────────────────────────────────────────────

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: conversationId } = use(params);
  const searchParams = useSearchParams();
  const [text, setText] = useState<string>("");
  const [model] = useState<string>(models[0].id);
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);

  const { messages, status, sendMessage } = useStreamingChat();
  const initialSentRef = useRef(false);

  // Handle initial query from URL search params
  useEffect(() => {
    if (initialSentRef.current) {
      return;
    }
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
    if (!message.text && !message.files?.length) {
      return;
    }
    sendMessage(message.text || "Sent with attachments", {
      body: { conversationId, model, webSearch: useWebSearch },
    });
    setText("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      {/* Conversation area */}
      <Conversation className="flex-1 overflow-hidden">
        <ConversationContent>
          <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
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

      {/* Input area */}
      <div className="py-3 max-w-5xl mx-auto w-full">
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
