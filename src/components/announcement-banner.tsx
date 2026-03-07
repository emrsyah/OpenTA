"use client";

import { GraduationCap, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ANNOUNCEMENT_KEY = "openta-announcement-cari-dosen-dismissed";

export function AnnouncementBanner() {
  const [isDismissed, setIsDismissed] = useState(true); // Start true to prevent flash
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const dismissed = localStorage.getItem(ANNOUNCEMENT_KEY);
    setIsDismissed(dismissed === "true");
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(ANNOUNCEMENT_KEY, "true");
    setIsDismissed(true);
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          <div className="relative flex items-center justify-center gap-3 px-4 py-2.5 bg-linear-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-primary/20">
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                NEW
              </Badge>
              <div className="flex items-center gap-2 text-sm">
                <GraduationCap className="size-4 text-primary shrink-0" />
                <span className="text-foreground/90">
                  Introducing{" "}
                  <strong className="font-semibold">Cari Dosen</strong> — Find
                  lecturers with AI-powered search
                </span>
              </div>
              <Button
                variant="link"
                size="sm"
                asChild
                className="h-auto p-0 text-primary font-medium text-sm hover:underline"
              >
                <Link href="/cari-dosen">Try it now →</Link>
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleDismiss}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Dismiss announcement"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
