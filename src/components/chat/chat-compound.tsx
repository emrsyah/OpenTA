// ───────────────────────────────────────────────────────────────────────────────
// Chat Compound Components
// ───────────────────────────────────────────────────────────────────────────────

"use client";

import { GlobeIcon } from "lucide-react";
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
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  MessageEntry,
  PromptInputAttachmentsDisplay,
  SourceSelector,
} from "@/components/chat";
import { ChatProvider, useChatContext } from "./chat-provider";

// ─── Chat.Frame ───────────────────────────────────────────────────────────────

export interface ChatFrameProps {
  children: React.ReactNode;
}

export function ChatFrame({ children }: ChatFrameProps) {
  return <div className="flex flex-col h-[calc(100vh-2rem)]">{children}</div>;
}

// ─── Chat.LoadingState ─────────────────────────────────────────────────────────

export function ChatLoadingState() {
  return (
    <div className="max-w-5xl mx-auto w-full flex items-center justify-center py-20">
      <div className="text-center text-muted-foreground">
        <p className="text-sm">Loading conversation...</p>
      </div>
    </div>
  );
}

// ─── Chat.EmptyState ──────────────────────────────────────────────────────────

export function ChatEmptyState() {
  return (
    <div className="max-w-5xl mx-auto w-full flex items-center justify-center py-20">
      <div className="text-center text-muted-foreground">
        <p className="text-sm">Start a conversation...</p>
      </div>
    </div>
  );
}

// ─── Chat.ConversationArea ─────────────────────────────────────────────────────

export function ChatConversationArea() {
  const { state } = useChatContext();
  const { messages, status, isLoadingHistory } = state;

  return (
    <Conversation className="flex-1 overflow-hidden">
      <ConversationContent scrollClassName="custom-scrollbar">
        {isLoadingHistory ? (
          <ChatLoadingState />
        ) : messages.length === 0 ? (
          <ChatEmptyState />
        ) : (
          <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
            {messages.map((message) => (
              <MessageEntry
                key={message.id}
                message={message}
                isStreaming={status === "streaming"}
              />
            ))}
          </div>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}

// ─── Chat.WebSearchToggle ─────────────────────────────────────────────────────

export function ChatWebSearchToggle() {
  const { state, actions } = useChatContext();
  const { webSearchEnabled } = state;
  const { setWebSearchEnabled } = actions;

  return (
    <PromptInputButton
      onClick={() => setWebSearchEnabled(!webSearchEnabled)}
      tooltip={{ content: "Search the web", shortcut: "⌘K" }}
      variant={webSearchEnabled ? "default" : "ghost"}
      type="button"
    >
      <GlobeIcon size={16} />
      <span>Deep Research</span>
    </PromptInputButton>
  );
}

// ─── Chat.InputArea ───────────────────────────────────────────────────────────

export function ChatInputArea() {
  const { state, actions } = useChatContext();
  const { status, sourceTypes } = state;
  const { sendMessage, setSourceTypes } = actions;

  const handleSubmit = (message: any) => {
    if (!message.text && !message.files?.length) return;
    sendMessage(message.text, message.files);
  };

  return (
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
          <PromptInputTextarea placeholder="Type your message..." />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
            <SourceSelector
              onChange={setSourceTypes}
              selectedSources={sourceTypes}
            />
            <ChatWebSearchToggle />
          </PromptInputTools>
          <PromptInputSubmit
            disabled={status === "streaming"}
            status={status}
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

// ─── Export Compound Component ────────────────────────────────────────────────

const Chat = {
  Provider: ChatProvider,
  Frame: ChatFrame,
  ConversationArea: ChatConversationArea,
  LoadingState: ChatLoadingState,
  EmptyState: ChatEmptyState,
  InputArea: ChatInputArea,
  WebSearchToggle: ChatWebSearchToggle,
};

export default Chat;

// Re-export for convenience
export {
  type ChatActions,
  type ChatContextValue,
  type ChatMeta,
  type ChatProviderProps,
  type ChatState,
  useChatContext,
} from "./chat-provider";
