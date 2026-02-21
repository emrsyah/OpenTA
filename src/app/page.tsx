import type { Metadata } from "next";
import { HomePage } from "./home-client";

export const metadata: Metadata = {
  title: "OpenTa - Discover Telkom University Research",
  description:
    "The intelligent open directory for Telkom University research. Search, ask, and discover insights from alumni papers using advanced AI.",
};

export default function Home() {
  return <HomePage />;
}
