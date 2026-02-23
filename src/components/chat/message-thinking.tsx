import { Loader2Icon } from "lucide-react";
import { Shimmer } from "@/components/ai-elements/shimmer";

interface MessageThinkingProps {
  message?: string;
}

/**
 * Simple loading indicator shown while OpenTA is thinking
 * Displays a shimmer text effect instead of the Task panel
 */
export function MessageThinking({ message = "OpenTA is thinking..." }: MessageThinkingProps) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm py-1">
      <Loader2Icon className="size-4 animate-spin shrink-0" />
      <Shimmer className="text-sm">{message}</Shimmer>
    </div>
  );
}
