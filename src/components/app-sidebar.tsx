"use client";

import {
  Bookmark,
  BookOpen,
  GraduationCap,
  MessageSquare,
  Search,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth/client";
import { GoogleSsoButton } from "./auth/google-sso-button";
import { UserMenu } from "./auth/user-menu";

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
    title: "Saved Papers",
    url: "/saved",
    icon: Bookmark,
    description: "Your bookmarked research",
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    description: "Preferences and account",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const isAuthenticated = !isPending && session?.user;

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          <div>
            <h2 className="font-semibold text-sm">Open TA Telyu</h2>
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
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        {isAuthenticated ? (
          <div className="flex flex-col gap-2">
            <UserMenu />
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
