"use client";

import { AlertTriangle, Clock, Mail, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const MAINTENANCE_KEY = "openta-maintenance-dismissed";

function getTimeUntilNextMonth() {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const diff = nextMonth.getTime() - now.getTime();

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

export function MaintenanceBanner() {
  const [isDismissed, setIsDismissed] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(getTimeUntilNextMonth());
  const [nextMonthName, setNextMonthName] = useState("");

  useEffect(() => {
    setIsMounted(true);
    const dismissed = localStorage.getItem(MAINTENANCE_KEY);
    setIsDismissed(dismissed === "true");

    // Get next month name
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    setNextMonthName(
      nextMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    );
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntilNextMonth());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(MAINTENANCE_KEY, "true");
    setIsDismissed(true);
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  const { days, hours, minutes, seconds } = timeLeft;

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
          <div className="relative flex items-center justify-center gap-4 px-4 py-3 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/15 border-b border-amber-500/30">
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-500 shrink-0 animate-pulse" />
                <span className="text-sm font-semibold text-amber-200">
                  Project Currently Unavailable
                </span>
              </div>

              <div className="hidden sm:block w-px h-6 bg-amber-500/30" />

              <div className="flex items-center gap-2 text-sm">
                <Clock className="size-4 text-amber-500/80 shrink-0" />
                <span className="text-foreground/80">
                  Resumes in{" "}
                  <span className="font-mono font-bold text-amber-400">
                    {String(days).padStart(2, "0")}:
                    {String(hours).padStart(2, "0")}:
                    {String(minutes).padStart(2, "0")}:
                    {String(seconds).padStart(2, "0")}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  ({nextMonthName})
                </span>
              </div>

              <div className="hidden sm:block w-px h-6 bg-amber-500/30" />

              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Need help?</span>
                <a
                  href="mailto:muhammademir48@gmail.com"
                  className="flex items-center gap-1 text-amber-400 hover:text-amber-300 hover:underline transition-colors"
                >
                  <Mail className="size-3.5" />
                  <span className="text-xs">muhammademir48@gmail.com</span>
                </a>
              </div>

              <div className="text-xs text-muted-foreground/70 text-center max-w-xs">
                This service is temporarily down due to insufficient resources.
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleDismiss}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Dismiss maintenance notice"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
