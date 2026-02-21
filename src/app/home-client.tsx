"use client";

import { GlobeIcon } from "lucide-react";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { SourceSelector, type SourceType } from "@/components/chat";
import { SuggestionChips } from "@/components/suggestion-chips";
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

const models = [
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "claude-opus-4-20250514", name: "Claude 4 Opus" },
];

export function HomePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [text, setText] = useState<string>("");
  const [model, setModel] = useState<string>(models[0].id);
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
  const [sourceTypes, setSourceTypes] = useState<SourceType[]>(["all"]);

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
    if (sourceTypes.length > 0 && !sourceTypes.includes("all")) {
      params.set("sources", sourceTypes.join(","));
    }
    router.push(`/${conversationId}?${params.toString()}`);
  };

  const handleSuggestionClick = (suggestionText: string) => {
    setText(suggestionText);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      <Conversation className="flex-1 overflow-hidden">
        <ConversationContent>
          <div className="flex flex-col items-center justify-center h-full px-4">
            {/* ASCII Owl Mascot */}
            <pre className="text-foreground/30 text-xs mb-6 select-none hidden sm:block">
              {`   _____
  /     \\
  |  O O  |
  |   >   |
   \\ ___/
    |___|`}
            </pre>

            {/* Welcome Message */}
            <div className="text-center max-w-2xl space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">
                Welcome to Open TA Tel-U
              </h1>
              <p className="text-lg text-muted-foreground">
                Ask anything about Telkom University research papers.
                <br />
                Our AI helps you discover, understand, and discuss academic
                research.
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
              <PromptInputButton
                onClick={() => setUseWebSearch(!useWebSearch)}
                tooltip={{ content: "Search the web", shortcut: "⌘K" }}
                variant={useWebSearch ? "default" : "ghost"}
                type="button"
              >
                <GlobeIcon size={16} />
                <span>Deep Research</span>
              </PromptInputButton>
              {/* <PromptInputSelect
                onValueChange={(value) => {
                  setModel(value);
                }}
                value={model}
              >
                <PromptInputSelectTrigger>
                  <PromptInputSelectValue />
                </PromptInputSelectTrigger>
                <PromptInputSelectContent>
                  {models.map((model) => (
                    <PromptInputSelectItem key={model.id} value={model.id}>
                      {model.name}
                    </PromptInputSelectItem>
                  ))}
                </PromptInputSelectContent>
              </PromptInputSelect> */}
            </PromptInputTools>
            <PromptInputSubmit disabled={!text} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
