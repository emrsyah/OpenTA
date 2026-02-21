"use client";

import {
  Bookmark,
  BookOpen,
  Folder,
  GraduationCap,
  Loader2,
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
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const {
    conversations,
    removeConversation,
    refresh,
    addOptimisticConversation,
  } = useConversations();

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for scroll indicator
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle creating a new conversation
  const handleNewChat = () => {
    router.push(`/`);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConversationToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Handle deleting a conversation
  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/conversations/${conversationToDelete}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        removeConversation(conversationToDelete);
        if (pathname === `/${conversationToDelete}`) {
          router.push("/");
        }
        toast.success("Conversation deleted successfully");
      } else {
        toast.error("Failed to delete conversation");
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      toast.error("Failed to delete conversation");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  const isConversationActive = (id: string) => {
    const pathId = pathname.split("/")[1];
    return pathId === id;
  };

  // Handle scroll in conversations list
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setIsScrolled(target.scrollTop > 0);
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
      <SidebarContent className="hover-scrollbar">
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
          <SidebarGroup className="flex flex-col overflow-hidden">
            <SidebarGroupLabel className="flex items-center justify-between shrink-0">
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
            <SidebarGroupContent className="relative flex-1 min-h-0 overflow-hidden">
              {/* Scroll indicator - top shadow when scrolled */}

              {conversations.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">No chats yet</p>
                </div>
              ) : (
                <div
                  className="h-full overflow-y-auto scroll-smooth pr-1 hover-scrollbar"
                  onScroll={handleScroll}
                >
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
                            onClick={(e) => openDeleteDialog(conversation.id, e)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </SidebarMenuAction>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </div>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConversation();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
