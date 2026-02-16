import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GeistPixelSquare } from "geist/font/pixel";
import "./globals.css";

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
    process.env.NEXT_PUBLIC_APP_URL || "https://open-ta-telyu.vercel.app"
  ),
  title: {
    default: "Open TA Telyu",
    template: "%s | Open TA Telyu",
  },
  description:
    "A Platform for Telkom University Alumni Research Papers. Discover, access, and discuss research papers from Telkom University alumni.",
  keywords: [
    "Telkom University",
    "Open TA",
    "Research Papers",
    "Alumni",
    "Thesis",
    "Tugas Akhir",
    "Academic",
    "Repository",
  ],
  authors: [{ name: "Telyutizen" }],
  creator: "Telyutizen",
  publisher: "Open TA Telyu",
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
    title: "Open TA Telyu",
    description:
      "A Platform for Telkom University Alumni Research Papers. Discover, access, and discuss research papers from Telkom University alumni.",
    url: "https://open-ta-telyu.vercel.app",
    siteName: "Open TA Telyu",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Open TA Telyu",
    description:
      "A Platform for Telkom University Alumni Research Papers. Discover, access, and discuss research papers from Telkom University alumni.",
    creator: "@telyutizen",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${GeistPixelSquare.variable} antialiased font-mono`}
      >
        {children}
      </body>
    </html>
  );
}
