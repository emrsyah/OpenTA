"use client";

import { CheckIcon, Loader2Icon, SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Task,
  TaskContent,
  TaskItem,
  TaskTrigger,
} from "@/components/ai-elements/task";
import type { ChatMessage, PlanStep } from "@/hooks/use-streaming-chat";
import { MessageThinking } from "./message-thinking";

interface MessageResearchPanelProps {
  message: ChatMessage;
  isStreaming: boolean;
}

/**
 * Step icon that shows the current status of a research step
 */
const StepIcon = ({ status }: { status: PlanStep["status"] }) => {
  if (status === "done") {
    return <CheckIcon className="size-3.5 text-primary" />;
  }
  if (status === "active") {
    return <Loader2Icon className="size-3.5 animate-spin" />;
  }
  return (
    <span className="inline-block size-3.5 rounded-full border border-muted-foreground/30" />
  );
};

/**
 * Research panel component that displays the progress of research steps
 * Shows classification status and individual research steps with their queries
 */
export function MessageResearchPanel({
  message,
  isStreaming,
}: MessageResearchPanelProps) {
  const {
    classifyStatus,
    planSteps,
    answerStarted,
    isThinking,
    acknowledgment,
  } = message;
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (answerStarted) {
      setOpen(false);
    }
  }, [answerStarted]);

  // Show shimmer during thinking state
  // Keep shimmering until acknowledgment OR plan arrives (prevents empty gap)
  // Don't show shimmer if acknowledgment already exists
  if (isThinking && !acknowledgment) {
    return <MessageThinking message="OpenTA is thinking..." />;
  }

  // Only show Task panel if we have actual plan steps
  const hasPlanSteps = planSteps && planSteps.length > 0;
  if (!hasPlanSteps) {
    return null;
  }

  const isPlanRunning = isStreaming && !answerStarted;
  const stepCount = planSteps?.length ?? 0;
  const doneCount =
    planSteps?.filter((s) => s.status === "done").length ?? 0;
  const allDone = doneCount === stepCount && stepCount > 0;

  const label = isPlanRunning
    ? `Researching… ${doneCount}/${stepCount} steps`
    : allDone
      ? `Research complete · ${stepCount} steps`
      : "Research";

  return (
    <Task className="mb-3" open={open} onOpenChange={setOpen}>
      <TaskTrigger title={label}>
        <div className="flex w-full cursor-pointer items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground group">
          {isPlanRunning ? (
            <Loader2Icon className="size-4 animate-spin shrink-0" />
          ) : (
            <CheckIcon className="size-4 shrink-0 text-primary" />
          )}
          <p className="flex-1 text-sm">{label}</p>
          <span className="size-4 transition-transform group-data-[state=open]:rotate-180 shrink-0">
            ▾
          </span>
        </div>
      </TaskTrigger>
      <TaskContent>
        {/* Per-step tasks */}
        {planSteps?.map((step) => (
          <Task
            className="w-full"
            defaultOpen={step.status === "active"}
            key={step.id}
          >
            <TaskTrigger title={step.title}>
              <div className="flex w-full cursor-pointer items-center gap-2 text-sm transition-colors hover:text-foreground group">
                <StepIcon status={step.status} />
                <span
                  className={
                    step.status === "pending"
                      ? "text-muted-foreground/40"
                      : step.status === "active"
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                  }
                >
                  {step.title}
                </span>
                {(step.thinking || step.searchQuery) && (
                  <span className="ml-auto size-3.5 transition-transform group-data-[state=open]:rotate-180 shrink-0 text-muted-foreground">
                    ▾
                  </span>
                )}
              </div>
            </TaskTrigger>
            {(step.searchQuery || step.thinking) && (
              <TaskContent>
                {step.searchQuery && (
                  <TaskItem className="flex items-center gap-1.5 text-xs">
                    <SearchIcon className="size-3 shrink-0" />
                    <span className="italic truncate">{step.searchQuery}</span>
                    {step.paperCount !== undefined && (
                      <span className="shrink-0 text-muted-foreground">
                        · {step.paperCount} papers
                      </span>
                    )}
                  </TaskItem>
                )}
                {step.thinking && (
                  <TaskItem className="whitespace-pre-wrap text-xs leading-relaxed">
                    {step.thinking}
                  </TaskItem>
                )}
              </TaskContent>
            )}
          </Task>
        ))}
      </TaskContent>
    </Task>
  );
}
