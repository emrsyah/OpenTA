"use client";

import { BrainIcon, CheckIcon, Loader2Icon, SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Task,
  TaskContent,
  TaskItem,
  TaskTrigger,
} from "@/components/ai-elements/task";
import type { ChatMessage, PlanStep } from "@/hooks/use-streaming-chat";
import { AgentActivityFeed } from "./agent-activity-feed";
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
 * Research panel component that displays the progress of research steps.
 *
 * Detects whether the message was produced by the DeepAgents backend
 * (rich activity feed) or the legacy DSPy backend (plan steps) and
 * renders the appropriate UI.
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
    thinkingContent,
    activityFeed,
    toolCalls,
    subagents,
    planStepsList,
    agentStarted,
  } = message;

  // ── DeepAgents path: rich activity feed ──────────────────────────
  // If we have any activity feed events or tool call entries, use the
  // Manus-like AgentActivityFeed component.
  const hasDeepAgentsActivity =
    (activityFeed && activityFeed.length > 0) ||
    (toolCalls && Object.keys(toolCalls).length > 0) ||
    (subagents && Object.keys(subagents).length > 0) ||
    (planStepsList && planStepsList.length > 0) ||
    agentStarted;

  if (hasDeepAgentsActivity) {
    return (
      <AgentActivityFeed message={message} isStreaming={isStreaming} />
    );
  }

  // ── Legacy DSPy path: plan steps + thinking ──────────────────────

  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (answerStarted) {
      setOpen(false);
    }
  }, [answerStarted]);

  // Show shimmer during thinking state
  if (isThinking && !acknowledgment) {
    return <MessageThinking message="OpenTA is thinking..." />;
  }

  const hasPlanSteps = planSteps && planSteps.length > 0;
  const hasThinkingContent =
    thinkingContent && thinkingContent.trim().length > 0;

  if (!hasPlanSteps && !hasThinkingContent) {
    return null;
  }

  const isPlanRunning = isStreaming && !answerStarted;
  const stepCount = planSteps?.length ?? 0;
  const doneCount = planSteps?.filter((s) => s.status === "done").length ?? 0;
  const allDone = doneCount === stepCount && stepCount > 0;

  const label = isPlanRunning
    ? `Researching… ${doneCount}/${stepCount} steps`
    : allDone
      ? `Research complete · ${stepCount} steps`
      : "Research";

  return (
    <>
      {/* Research Plan Steps */}
      {hasPlanSteps && (
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
                        <span className="italic truncate">
                          {step.searchQuery}
                        </span>
                        {step.paperCount !== undefined && (
                          <span className="shrink-0 text-muted-foreground">
                            · {step.paperCount} papers
                          </span>
                        )}
                      </TaskItem>
                    )}
                    {step.reformulatedQuery && (
                      <TaskItem className="flex items-center gap-1.5 text-xs">
                        <SearchIcon className="size-3 shrink-0" />
                        <span className="italic text-muted-foreground">
                          Search broadened to: {step.reformulatedQuery.query}
                        </span>
                        {step.reformulatedQuery.paperCount !== undefined && (
                          <span className="shrink-0 text-muted-foreground">
                            · {step.reformulatedQuery.paperCount} papers
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
      )}

      {/* Chain of Thought Reasoning */}
      {hasThinkingContent && (
        <Task className="mb-3" defaultOpen={false}>
          <TaskTrigger title="Reasoning">
            <div className="flex w-full cursor-pointer items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground group">
              <BrainIcon className="size-4 shrink-0" />
              <p className="flex-1 text-sm">Reasoning</p>
              <span className="size-4 transition-transform group-data-[state=open]:rotate-180 shrink-0">
                ▾
              </span>
            </div>
          </TaskTrigger>
          <TaskContent>
            <TaskItem className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
              {thinkingContent}
            </TaskItem>
          </TaskContent>
        </Task>
      )}
    </>
  );
}
