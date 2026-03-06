"use client";

import { Loader2Icon, SparklesIcon } from "lucide-react";
import type { RefinementState } from "@/hooks/use-streaming-chat";

interface MessageRefinementIndicatorProps {
  refinementState: RefinementState;
  gapQuery?: string;
  paperCount?: number;
}

/**
 * Refinement indicator that appears above the answer during refinement
 * Shows current refinement status with a subtle animated effect
 */
export function MessageRefinementIndicator({
  refinementState,
  gapQuery,
  paperCount,
}: MessageRefinementIndicatorProps) {
  if (refinementState === "idle" || refinementState === "done") {
    return null;
  }

  const getSubtext = (): string => {
    switch (refinementState) {
      case "starting":
        if (gapQuery) {
          return `Analyzing answer for gaps: ${gapQuery}`;
        }
        return "Analyzing answer for gaps...";
      case "searching":
        return paperCount !== undefined
          ? `Found ${paperCount} additional papers...`
          : "Searching for additional papers...";
      case "streaming":
        return "Incorporating new information...";
      default:
        return "";
    }
  };

  const isActive =
    refinementState === "searching" || refinementState === "streaming";

  return (
    <div
      className={`
        mb-3 flex items-center gap-2 text-sm
        ${isActive ? "animate-pulse" : ""}
      `}
    >
      <div className="flex items-center gap-1.5 text-primary">
        <SparklesIcon className="size-4 shrink-0" />
        <span className="font-medium">Refining Answer</span>
        {refinementState === "streaming" && (
          <Loader2Icon className="size-3.5 animate-spin" />
        )}
      </div>
      <span className="text-muted-foreground">|</span>
      <span className="text-xs text-muted-foreground">{getSubtext()}</span>
    </div>
  );
}
