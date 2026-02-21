// ───────────────────────────────────────────────────────────────────────────────
// Source Selector: Component for selecting paper source types
// ───────────────────────────────────────────────────────────────────────────────

"use client";

import { FilterIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { PromptInputButton } from "@/components/ai-elements/prompt-input";
import type { SourceType } from "@/components/chat";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface SourceSelectorProps {
  selectedSources: SourceType[];
  onChange: (sources: SourceType[]) => void;
  className?: string;
}

const SOURCE_OPTIONS: { value: SourceType; label: string }[] = [
  { value: "all" as const, label: "All Sources" },
  { value: "s1" as const, label: "S1 (Skripsi)" },
  { value: "s2" as const, label: "S2 (Tesis)" },
  { value: "s3" as const, label: "S3 (Disertasi)" },
  { value: "book" as const, label: "Book Reference" },
];

export function SourceSelector({
  selectedSources,
  onChange,
  className,
}: SourceSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleSourceToggle = useCallback(
    (source: SourceType) => {
      if (source === "all") {
        // If "All" is clicked, clear other selections and set to all
        const isAllSelected = selectedSources.includes("all");
        onChange(isAllSelected ? [] : ["all"]);
        return;
      }

      // If selecting a specific source, remove "all" if present
      let newSources: SourceType[] = selectedSources.filter((s) => s !== "all");

      // Toggle the specific source
      if (newSources.includes(source)) {
        newSources = newSources.filter((s) => s !== source);
        // If no sources left, default back to "all"
        if (newSources.length === 0) {
          newSources = ["all"] as SourceType[];
        }
      } else {
        newSources = [...newSources, source];
      }

      onChange(newSources);
    },
    [selectedSources, onChange],
  );

  const getDisplayLabel = () => {
    if (selectedSources.includes("all") || selectedSources.length === 0) {
      return "All Sources";
    }
    const labels = selectedSources
      .map((s) => SOURCE_OPTIONS.find((opt) => opt.value === s)?.label)
      .filter(Boolean);
    return labels.join(", ");
  };

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger asChild>
        <PromptInputButton
          tooltip={{ content: "Filter by source type" }}
          variant={open ? "default" : "ghost"}
          className={className}
          type="button"
        >
          <FilterIcon size={16} />
          <span>{getDisplayLabel()}</span>
        </PromptInputButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel>Filter by source</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SOURCE_OPTIONS.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selectedSources.includes(option.value) as boolean}
            onCheckedChange={() => handleSourceToggle(option.value)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
