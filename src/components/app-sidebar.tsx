"use client";

import {
  Bookmark,
  BookOpen,
  Folder,
  GraduationCap,
  MessageSquare,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import { nanoid } from "nanoid";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useConversations } from "@/hooks/use-conversations";
import { authClient } from "@/lib/auth/client";
import { GoogleSsoButton } from "./auth/google-sso-button";
import { UserMenu } from "./auth/user-menu";
import { Separator } from "./ui/separator";

// Menu items for Telkom University Research Directory
const items = [
  {
    title: "Home",
    url: "/",
    icon: MessageSquare,
    description: "Ask questions about research papers",
  },
  {
    title: "Browse Papers",
    url: "/browse",
    icon: BookOpen,
    description: "Explore alumni research",
  },
  {
    title: "Workspace",
    url: "/workspace",
    icon: Folder,
    description: "Manage your research",
  },
  {
    title: "Saved Papers",
    url: "/saved",
    icon: Bookmark,
    description: "Your bookmarked research",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const isAuthenticated = !isPending && session?.user;
  const { conversations, removeConversation, refresh, addOptimisticConversation } = useConversations();

  // Handle creating a new conversation
  const handleNewChat = () => {
    router.push(`/`);
  };

  // Handle deleting a conversation
  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        removeConversation(id);
        if (pathname === `/${id}`) {
          router.push("/");
        }
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const isConversationActive = (id: string) => {
    const pathId = pathname.split("/")[1];
    return pathId === id;
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <Image
            src="/favicon/favicon-32x32.png"
            alt="Open TA"
            width={24}
            height={24}
            className="h-6 w-6"
          />
          <div>
            <h2 className="font-semibold text-sm">OpenTA</h2>
            <p className="text-xs text-muted-foreground">Research Directory</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAuthenticated && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
              Recent Chats
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleNewChat}
              >
                <Plus className="h-3 w-3 mr-1" />
                New
              </Button>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {conversations.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">No chats yet</p>
                </div>
              ) : (
                <SidebarMenu>
                  {conversations.map((conversation) => (
                    <SidebarMenuItem key={conversation.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={isConversationActive(conversation.id)}
                      >
                        <Link href={`/${conversation.id}`}>
                          <MessageSquare className="h-4 w-4" />
                          {conversation.title === null ? (
                            // Skeleton loading state
                            <div className="flex-1 h-4 bg-muted animate-pulse" />
                          ) : (
                            <span className="truncate flex-1">
                              {conversation.title}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                      <SidebarMenuAction showOnHover>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => handleDeleteConversation(conversation.id, e)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </SidebarMenuAction>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        {isAuthenticated ? (
          <div className="flex flex-col gap-2">
            <UserMenu />
            <Separator className="my-1" />
            <p className="text-xs text-muted-foreground text-center">
              "Knowledge doesn't wait to be found. It waits to be asked."
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <GoogleSsoButton />
            <p className="text-xs text-muted-foreground text-center">
              "Knowledge doesn't wait to be found. It waits to be asked."
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
