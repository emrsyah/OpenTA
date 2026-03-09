"use client";

import {
  BotIcon,
  BrainIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleDotIcon,
  FileSearchIcon,
  ListTodoIcon,
  Loader2Icon,
  NetworkIcon,
  SearchIcon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type {
  ActivityEvent,
  ChatMessage,
  SubagentEntry,
  ToolCallEntry,
} from "@/hooks/use-streaming-chat";

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function truncate(s: string, max: number = 80): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + "…";
}

const TOOL_ICONS: Record<string, typeof SearchIcon> = {
  search_papers: SearchIcon,
  get_paper_details: FileSearchIcon,
  write_todos: ListTodoIcon,
  task: NetworkIcon,
};

function getToolIcon(toolName: string) {
  return TOOL_ICONS[toolName] || WrenchIcon;
}

// ── ToolCallCard ────────────────────────────────────────────────────────────

interface ToolCallCardProps {
  entry: ToolCallEntry;
  isStreaming: boolean;
}

const ToolCallCard = memo(function ToolCallCard({
  entry,
  isStreaming,
}: ToolCallCardProps) {
  const [open, setOpen] = useState(false);
  const Icon = getToolIcon(entry.tool);

  const isDone = entry.status === "done";
  const isActive =
    entry.status === "calling" ||
    entry.status === "streaming_args" ||
    entry.status === "executing";
  const duration =
    entry.finishedAt && entry.startedAt
      ? formatDuration(entry.finishedAt - entry.startedAt)
      : null;

  // Format args for display
  const argsDisplay = useMemo(() => {
    if (!entry.argsParsed) return null;
    const entries = Object.entries(entry.argsParsed).filter(
      ([k]) => k !== "self",
    );
    if (entries.length === 0) return null;
    return entries;
  }, [entry.argsParsed]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
            "hover:bg-accent/50",
            isDone && entry.result?.success
              ? "border-emerald-500/20 bg-emerald-500/5"
              : isDone && !entry.result?.success
                ? "border-red-500/20 bg-red-500/5"
                : isActive
                  ? "border-primary/30 bg-primary/5"
                  : "border-border",
          )}
        >
          {/* Status indicator */}
          {isActive ? (
            <Loader2Icon className="size-4 shrink-0 animate-spin text-primary" />
          ) : isDone && entry.result?.success ? (
            <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" />
          ) : isDone ? (
            <XCircleIcon className="size-4 shrink-0 text-red-500" />
          ) : (
            <CircleDotIcon className="size-4 shrink-0 text-muted-foreground" />
          )}

          {/* Tool icon + name */}
          <Icon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="font-mono text-xs font-medium">{entry.tool}</span>

          {/* Source badge */}
          {entry.source !== "main" && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              subagent
            </Badge>
          )}

          {/* Quick summary */}
          <span className="flex-1 truncate text-xs text-muted-foreground">
            {entry.searchQuery
              ? `"${truncate(entry.searchQuery, 50)}"`
              : entry.result?.summary
                ? truncate(entry.result.summary, 50)
                : isActive
                  ? "Executing..."
                  : ""}
          </span>

          {/* Duration */}
          {duration && (
            <span className="shrink-0 text-[10px] text-muted-foreground/60">
              {duration}
            </span>
          )}

          {/* Paper count badge */}
          {entry.searchPaperCount !== undefined &&
            entry.searchPaperCount > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 font-mono"
              >
                {entry.searchPaperCount} papers
              </Badge>
            )}

          <ChevronDownIcon
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-1.5 ml-6 space-y-2 border-l-2 border-muted pl-3 pb-1">
          {/* Arguments */}
          {argsDisplay && argsDisplay.length > 0 && (
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                Arguments
              </p>
              <div className="rounded-md bg-muted/50 px-2.5 py-1.5 font-mono text-[11px] leading-relaxed">
                {argsDisplay.map(([key, value]) => (
                  <div key={key} className="flex gap-1.5">
                    <span className="text-primary/70">{key}:</span>
                    <span className="text-foreground/80">
                      {typeof value === "string"
                        ? `"${truncate(value, 60)}"`
                        : JSON.stringify(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search results */}
          {entry.searchPapers && entry.searchPapers.length > 0 && (
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                Results
              </p>
              <div className="space-y-1">
                {entry.searchPapers.map((paper) => (
                  <div
                    key={paper.number}
                    className="flex items-start gap-1.5 text-[11px]"
                  >
                    <Badge
                      variant="outline"
                      className="mt-0.5 shrink-0 text-[9px] px-1 py-0 font-mono"
                    >
                      {paper.number}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground/80">
                        {paper.title}
                      </p>
                      <p className="text-muted-foreground/60">
                        {paper.authors.slice(0, 2).join(", ")}
                        {paper.authors.length > 2 ? " et al." : ""} ·{" "}
                        {paper.year}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result summary */}
          {entry.result && (
            <div className="text-[11px] text-muted-foreground">
              <span
                className={
                  entry.result.success
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-500"
                }
              >
                {entry.result.success ? "✓" : "✗"}
              </span>{" "}
              {entry.result.summary}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});

// ── SubagentCard ────────────────────────────────────────────────────────────

interface SubagentCardProps {
  entry: SubagentEntry;
  toolCalls: Record<string, ToolCallEntry>;
  isStreaming: boolean;
}

const SubagentCard = memo(function SubagentCard({
  entry,
  toolCalls,
  isStreaming,
}: SubagentCardProps) {
  const [open, setOpen] = useState(true);

  const isDone = entry.status === "complete";
  const isRunning = entry.status === "running" || entry.status === "spawning";

  // Find tool calls belonging to this subagent
  const subagentToolCalls = useMemo(
    () =>
      Object.values(toolCalls).filter(
        (tc) => tc.source === entry.id || tc.isSubagent,
      ),
    [toolCalls, entry.id],
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
            "hover:bg-accent/50",
            isDone
              ? "border-blue-500/20 bg-blue-500/5"
              : isRunning
                ? "border-violet-500/20 bg-violet-500/5"
                : "border-border",
          )}
        >
          {isRunning ? (
            <Loader2Icon className="size-4 shrink-0 animate-spin text-violet-500" />
          ) : isDone ? (
            <CheckCircle2Icon className="size-4 shrink-0 text-blue-500" />
          ) : (
            <BotIcon className="size-4 shrink-0 text-muted-foreground" />
          )}

          <NetworkIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="font-medium text-xs">{entry.type}</span>

          <span className="flex-1 truncate text-xs text-muted-foreground">
            {truncate(entry.description, 60)}
          </span>

          {entry.toolCalls.length > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 font-mono"
            >
              {entry.toolCalls.length} calls
            </Badge>
          )}

          <ChevronDownIcon
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-1.5 ml-6 space-y-2 border-l-2 border-violet-500/20 pl-3 pb-1">
          {/* Description */}
          {entry.description && (
            <p className="text-[11px] text-muted-foreground">
              {entry.description}
            </p>
          )}

          {/* Nested tool calls from subagent */}
          {subagentToolCalls.length > 0 && (
            <div className="space-y-1.5">
              {subagentToolCalls.map((tc) => (
                <ToolCallCard
                  key={tc.id}
                  entry={tc}
                  isStreaming={isStreaming}
                />
              ))}
            </div>
          )}

          {/* Subagent stream text */}
          {entry.streamText && (
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                Output
              </p>
              <div className="max-h-32 overflow-y-auto rounded-md bg-muted/50 px-2.5 py-1.5 text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {entry.streamText.length > 500
                  ? entry.streamText.slice(0, 500) + "…"
                  : entry.streamText}
              </div>
            </div>
          )}

          {/* Result preview */}
          {entry.resultPreview && (
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
              ✓ {truncate(entry.resultPreview, 150)}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});

// ── PlanStepRow ─────────────────────────────────────────────────────────────
// Renders one plan step label + the tool calls that belong to it, inline.

interface PlanStepRowProps {
  index: number;
  label: string;
  stepToolCalls: (ToolCallEntry & { planStepIndex: number })[];
  isStreaming: boolean;
  /** true once the agent has started writing the final answer */
  answerStarted: boolean;
  /** highest planStepIndex that has received any tool call so far */
  maxAssignedIndex: number;
}

const PlanStepRow = memo(function PlanStepRow({
  index,
  label,
  stepToolCalls,
  isStreaming,
  answerStarted,
  maxAssignedIndex,
}: PlanStepRowProps) {
  const hasActive = stepToolCalls.some(
    (tc) => tc.status !== "done" && tc.status !== "error",
  );
  const allDone =
    stepToolCalls.length > 0 && stepToolCalls.every((tc) => tc.status === "done");

  // A step is "done" if:
  //  • its tool calls are all done, OR
  //  • it has no tool calls but a later step already has tool calls (was skipped / synthesis), OR
  //  • it has no tool calls and the agent has started writing the answer
  const isDone =
    allDone ||
    (stepToolCalls.length === 0 &&
      (index <= maxAssignedIndex || answerStarted));

  const isPending = !isDone && !hasActive;

  // Auto-open the row while a tool call is in progress
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [hasActive]);

  const hasContent = stepToolCalls.length > 0;

  return (
    <div className="group">
      <button
        type="button"
        onClick={() => hasContent && setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors",
          hasContent && "hover:bg-accent/40 cursor-pointer",
          !hasContent && "cursor-default",
          hasActive
            ? "bg-primary/5"
            : isDone
              ? "bg-transparent"
              : "bg-transparent",
        )}
      >
        {/* Step status icon */}
        <span className="shrink-0">
          {hasActive ? (
            <Loader2Icon className="size-3.5 animate-spin text-primary" />
          ) : isDone ? (
            <CheckCircle2Icon className="size-3.5 text-emerald-500" />
          ) : (
            <CircleDotIcon className="size-3.5 text-muted-foreground/40" />
          )}
        </span>

        {/* Step number */}
        <span
          className={cn(
            "shrink-0 font-mono text-[10px] tabular-nums",
            isDone
              ? "text-muted-foreground/50"
              : hasActive
                ? "text-primary/70"
                : "text-muted-foreground/30",
          )}
        >
          {index + 1}.
        </span>

        {/* Step label */}
        <span
          className={cn(
            "flex-1 text-sm",
            isDone
              ? "text-muted-foreground"
              : hasActive
                ? "font-medium text-foreground"
                : isPending
                  ? "text-muted-foreground/40"
                  : "text-muted-foreground",
          )}
        >
          {label}
        </span>

        {/* Paper count summary */}
        {allDone &&
          stepToolCalls.some(
            (tc) => tc.searchPaperCount !== undefined && tc.searchPaperCount > 0,
          ) && (
            <Badge
              variant="secondary"
              className="shrink-0 text-[10px] px-1.5 py-0 font-mono"
            >
              {stepToolCalls.reduce(
                (sum, tc) => sum + (tc.searchPaperCount ?? 0),
                0,
              )}{" "}
              papers
            </Badge>
          )}

        {/* Duration for the step's tool calls */}
        {allDone &&
          stepToolCalls[0]?.finishedAt &&
          stepToolCalls[0]?.startedAt && (
            <span className="shrink-0 text-[10px] text-muted-foreground/50">
              {formatDuration(
                stepToolCalls[stepToolCalls.length - 1].finishedAt! -
                  stepToolCalls[0].startedAt,
              )}
            </span>
          )}

        {/* Chevron when expandable */}
        {hasContent && (
          <ChevronDownIcon
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground/50 transition-transform",
              open && "rotate-180",
            )}
          />
        )}
      </button>

      {/* Tool calls embedded inside the step */}
      {open && hasContent && (
        <div className="ml-8 mt-1 mb-2 space-y-1.5 border-l-2 border-muted/60 pl-3">
          {stepToolCalls.map((tc) => (
            <ToolCallCard key={tc.id} entry={tc} isStreaming={isStreaming} />
          ))}
        </div>
      )}
    </div>
  );
});

// ── PlanWithSteps ───────────────────────────────────────────────────────────
// Renders the plan steps list with their associated tool calls inline.
// Used when the agent called create_plan first.

interface PlanWithStepsProps {
  planStepsList: string[];
  toolCallEntries: ToolCallEntry[];
  isStreaming: boolean;
  answerStarted: boolean;
}

const PlanWithSteps = memo(function PlanWithSteps({
  planStepsList,
  toolCallEntries,
  isStreaming,
  answerStarted,
}: PlanWithStepsProps) {
  // Assign a planStepIndex to each non-create_plan tool call, in arrival order
  const enriched = useMemo(() => {
    let idx = 0;
    return toolCallEntries.map((tc) => ({
      ...tc,
      planStepIndex: tc.tool === "create_plan" ? -1 : idx++,
    }));
  }, [toolCallEntries]);

  const maxAssignedIndex = useMemo(
    () =>
      enriched.reduce(
        (max, tc) => (tc.planStepIndex >= 0 ? Math.max(max, tc.planStepIndex) : max),
        -1,
      ),
    [enriched],
  );

  return (
    <div className="space-y-0.5">
      {/* Plan header */}
      <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
        <ListTodoIcon className="size-3" />
        <span>Plan ({planStepsList.length} steps)</span>
      </div>

      {/* Steps */}
      {planStepsList.map((label, i) => {
        const stepToolCalls = enriched.filter((tc) => tc.planStepIndex === i);
        return (
          <PlanStepRow
            key={i}
            index={i}
            label={label}
            stepToolCalls={stepToolCalls}
            isStreaming={isStreaming}
            answerStarted={answerStarted}
            maxAssignedIndex={maxAssignedIndex}
          />
        );
      })}
    </div>
  );
});

// ── Main AgentActivityFeed ──────────────────────────────────────────────────

interface AgentActivityFeedProps {
  message: ChatMessage;
  isStreaming: boolean;
}

/**
 * Manus-like real-time activity feed.
 *
 * Two rendering modes:
 * 1. **Plan mode** (when agent called create_plan):
 *    Each plan step is shown in order. Tool calls that belong to a step
 *    are rendered inline inside that step when expanded — not as a
 *    separate flat list at the top.
 * 2. **Flat mode** (simple single-step queries without a plan):
 *    Tool calls shown as a flat timeline, same as before.
 */
export const AgentActivityFeed = memo(function AgentActivityFeed({
  message,
  isStreaming,
}: AgentActivityFeedProps) {
  const [feedOpen, setFeedOpen] = useState(true);

  // Auto-collapse the outer wrapper when the answer finishes streaming
  useEffect(() => {
    if (message.answerStarted && !isStreaming) {
      setFeedOpen(false);
    }
  }, [message.answerStarted, isStreaming]);

  const {
    toolCalls,
    subagents,
    planStepsList,
    agentStarted,
    isThinking,
    acknowledgment,
    thinkingContent,
  } = message;

  // All main-agent tool calls, sorted by arrival time
  const toolCallEntries = useMemo(
    () =>
      Object.values(toolCalls)
        .filter((tc) => tc.source === "main")
        .sort((a, b) => a.startedAt - b.startedAt),
    [toolCalls],
  );

  const subagentEntries = useMemo(
    () =>
      Object.values(subagents).sort(
        (a, b) =>
          (a.events[0]?.timestamp ?? 0) - (b.events[0]?.timestamp ?? 0),
      ),
    [subagents],
  );

  const hasPlan = planStepsList.length > 0;
  const hasActivity =
    toolCallEntries.length > 0 ||
    subagentEntries.length > 0 ||
    hasPlan ||
    (thinkingContent && thinkingContent.trim().length > 0);

  // Initial thinking shimmer
  if (isThinking && !acknowledgment && !hasActivity) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-1">
        <Loader2Icon className="size-4 animate-spin shrink-0" />
        <span className="text-sm animate-pulse">OpenTA is thinking...</span>
      </div>
    );
  }

  if (!hasActivity) return null;

  // ── Header stats ────────────────────────────────────────────────────
  const totalToolCalls = toolCallEntries.length;
  const completedToolCalls = toolCallEntries.filter(
    (tc) => tc.status === "done",
  ).length;
  const totalSubagents = subagentEntries.length;
  const completedSubagents = subagentEntries.filter(
    (s) => s.status === "complete",
  ).length;
  const isAllDone =
    !isStreaming ||
    (completedToolCalls === totalToolCalls &&
      completedSubagents === totalSubagents &&
      message.answerStarted);

  const headerLabel = isAllDone ? "Research complete" : "Researching…";

  const statsLabel = [
    totalToolCalls > 0
      ? `${completedToolCalls}/${totalToolCalls} steps`
      : null,
    totalSubagents > 0
      ? `${completedSubagents}/${totalSubagents} subagents`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Collapsible open={feedOpen} onOpenChange={setFeedOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground group mb-2"
        >
          {isAllDone ? (
            <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" />
          ) : (
            <Loader2Icon className="size-4 shrink-0 animate-spin text-primary" />
          )}
          <span className="flex-1 text-left text-sm font-medium">
            {headerLabel}
          </span>
          {statsLabel && (
            <span className="text-xs text-muted-foreground/60">{statsLabel}</span>
          )}
          <ChevronDownIcon
            className={cn(
              "size-4 shrink-0 transition-transform",
              feedOpen && "rotate-180",
            )}
          />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="space-y-2 mb-3">
          {/* Chain of Thought (if any) */}
          {thinkingContent && thinkingContent.trim().length > 0 && (
            <Collapsible defaultOpen={false}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm hover:bg-accent/50 transition-colors"
                >
                  <BrainIcon className="size-4 shrink-0 text-amber-500" />
                  <span className="font-medium text-xs">Reasoning</span>
                  <ChevronDownIcon className="ml-auto size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-1.5 ml-6 border-l-2 border-amber-500/20 pl-3 pb-1">
                  <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-muted-foreground max-h-48 overflow-y-auto">
                    {thinkingContent}
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* ── Plan mode: steps with embedded tool calls ── */}
          {hasPlan ? (
            <>
              <PlanWithSteps
                planStepsList={planStepsList}
                toolCallEntries={toolCallEntries}
                isStreaming={isStreaming}
                answerStarted={message.answerStarted ?? false}
              />

              {/* Subagents (if any) still shown below the plan */}
              {subagentEntries.map((entry) => (
                <SubagentCard
                  key={entry.id}
                  entry={entry}
                  toolCalls={toolCalls}
                  isStreaming={isStreaming}
                />
              ))}
            </>
          ) : (
            <>
              {/* ── Flat mode: no plan, just tool calls in order ── */}
              {toolCallEntries.map((entry) => (
                <ToolCallCard
                  key={entry.id}
                  entry={entry}
                  isStreaming={isStreaming}
                />
              ))}

              {/* Subagents */}
              {subagentEntries.map((entry) => (
                <SubagentCard
                  key={entry.id}
                  entry={entry}
                  toolCalls={toolCalls}
                  isStreaming={isStreaming}
                />
              ))}
            </>
          )}

          {/* Duration */}
          {message.durationMs && (
            <div className="text-[10px] text-muted-foreground/50 text-right">
              Total: {formatDuration(message.durationMs)}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});
