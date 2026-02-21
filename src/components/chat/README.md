# Chat Compound Components - Usage Examples

This file demonstrates how to use the Chat compound components to create different variants without boolean prop proliferation.

## ⚠️ Important: Server vs Client Component Imports

When using in **Server Components** (like `page.tsx`), import components directly:

```tsx
// ✅ CORRECT for Server Components
import {
  ChatProvider,
  ChatFrame,
  ChatConversationArea,
  ChatInputArea,
} from "@/components/chat";

export default async function ChatPage({ params, searchParams }) {
  const { id } = await params;
  const { q } = await searchParams;

  return (
    <ChatProvider conversationId={id} initialQuery={q}>
      <ChatFrame>
        <ChatConversationArea />
        <ChatInputArea />
      </ChatFrame>
    </ChatProvider>
  );
}
```

When using in **Client Components**, you can use either direct imports or the compound object pattern (but only if the parent is a Client Component):

```tsx
// ✅ CORRECT for Client Components
"use client";

import { Chat } from "@/components/chat";

export default function ChatWrapper() {
  return (
    <Chat.Provider conversationId="123">
      <Chat.Frame>
        <Chat.ConversationArea />
        <Chat.InputArea />
      </Chat.Frame>
    </Chat.Provider>
  );
}
```

## Basic Chat Page (Server Component)

```tsx
// src/app/[id]/page.tsx
import type { Metadata } from "next";
import {
  ChatProvider,
  ChatFrame,
  ChatConversationArea,
  ChatInputArea,
} from "@/components/chat";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Chat ${id} - Open TA Tel-U`,
    description: "AI-powered research assistant",
  };
}

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id } = await params;
  const { q } = await searchParams;

  return (
    <ChatProvider
      conversationId={id}
      initialWebSearch={false}
      initialQuery={q}
    >
      <ChatFrame>
        <ChatConversationArea />
        <ChatInputArea />
      </ChatFrame>
    </ChatProvider>
  );
}
```

## Research Chat Page (Web Search Enabled)

```tsx
// src/app/research/[id]/page.tsx
import {
  ChatProvider,
  ChatFrame,
  ChatConversationArea,
  ChatInputArea,
} from "@/components/chat";

export default async function ResearchChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ChatProvider conversationId={id} initialWebSearch={true}>
      <ChatFrame>
        <ChatConversationArea />
        <ChatInputArea />
      </ChatFrame>
    </ChatProvider>
  );
}
```

## Custom Layout with Sidebar Preview

```tsx
// src/app/[id]/page.tsx
import {
  ChatProvider,
  ChatFrame,
  ChatConversationArea,
  ChatInputArea,
} from "@/components/chat";
import { SidebarPreview } from "./sidebar-preview";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <ChatProvider conversationId={id}>
      <div className="flex">
        <ChatFrame>
          <ChatConversationArea />
          <ChatInputArea />
        </ChatFrame>
        <SidebarPreview />
      </div>
    </ChatProvider>
  );
}
```

```tsx
// src/app/[id]/sidebar-preview.tsx
"use client";

import { useChatContext } from "@/components/chat";

export function SidebarPreview() {
  const { state } = useChatContext();
  const { messages } = state;

  return (
    <aside className="w-64 border-l">
      <h3>Last Message</h3>
      <p>{messages[messages.length - 1]?.content || "No messages"}</p>
    </aside>
  );
}
```

## Headless Chat (Custom UI)

```tsx
// src/app/custom/[id]/page.tsx
"use client";

import { ChatProvider, useChatContext } from "@/components/chat";

function CustomConversationUI() {
  const { state, actions } = useChatContext();
  const { messages } = state;
  const { sendMessage } = actions;

  return (
    <div className="custom-chat-ui">
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <button onClick={() => sendMessage("Hello")}>Send</button>
    </div>
  );
}

export default function CustomChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = use(params);

  return (
    <ChatProvider conversationId={conversationId}>
      <CustomConversationUI />
    </ChatProvider>
  );
}
```

## Benefits of Compound Components

1. **No Boolean Proliferation**: Each variant is explicit about what it renders
2. **Reusable State**: Can access chat state from anywhere within provider
3. **Composable**: Mix and match components as needed
4. **Testable**: Can mock ChatProvider for testing
5. **Type-Safe**: Full TypeScript support for all components

## State Access with useChatContext

```tsx
"use client";

import { useChatContext } from "@/components/chat";

function MyComponent() {
  const { state, actions, meta } = useChatContext();

  // State
  const { messages, status, webSearchEnabled } = state;

  // Actions
  const { sendMessage, setWebSearchEnabled } = actions;

  // Meta (refs, etc)
  const { initialSentRef } = meta;

  return <div>...</div>;
}
```

## Available Components

```tsx
// Provider (required)
import { ChatProvider } from "@/components/chat";

// Layout components
import { ChatFrame } from "@/components/chat";
import { ChatConversationArea } from "@/components/chat";
import { ChatInputArea } from "@/components/chat";

// State components (for useChatContext)
import { useChatContext } from "@/components/chat";

// Optional components
import { ChatLoadingState } from "@/components/chat";
import { ChatEmptyState } from "@/components/chat";
import { ChatWebSearchToggle } from "@/components/chat";
```

