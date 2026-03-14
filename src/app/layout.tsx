import { GeistPixelSquare } from "geist/font/pixel";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://open-ta-telyu.vercel.app",
  ),
  title: {
    default: "Open TA",
    template: "%s | Open TA",
  },
  description:
    "The intelligent open directory for Telkom University research. Search, ask, and discover insights from alumni papers using advanced AI.",
  keywords: [
    "Telkom University",
    "Open TA",
    "Research Papers",
    "Alumni",
    "Thesis",
    "Tugas Akhir",
    "Academic",
    "Repository",
    "AI Research Assistant",
  ],
  authors: [{ name: "Telyutizen" }],
  creator: "Telyutizen",
  publisher: "Open TA",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Open TA",
    description:
      "The intelligent open directory for Telkom University research. Search, ask, and discover insights from alumni papers using advanced AI.",
    url: "https://open-ta-telyu.vercel.app",
    siteName: "Open TA",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Open TA",
    description:
      "The intelligent open directory for Telkom University research. Search, ask, and discover insights from alumni papers using advanced AI.",
    creator: "@telyutizen",
  },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon/favicon.ico",
    apple: [
      {
        url: "/favicon/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${GeistPixelSquare.variable} antialiased font-mono`}
      >
        <TooltipProvider>
          <SidebarProvider className="h-svh overflow-hidden">
            <AppSidebar />
            <SidebarInset className="overflow-hidden">
              <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="h-6" />
                <span className="text-sm font-medium">OpenTA</span>
              </header>
              <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
        <Analytics />
        <Toaster />
      </body>
    </html>
  );
}
