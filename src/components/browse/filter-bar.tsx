"use client";

import { Filter, Search, Tag, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATALOG_TYPES, useFilters, YEARS } from "./filter-context";

// Root FilterBar component
interface FilterBarProps {
  children: React.ReactNode;
}

export function FilterBar({ children }: FilterBarProps) {
  return <>{children}</>;
}

// Search Input Component
FilterBar.Search = function FilterBarSearch() {
  const { state, actions } = useFilters();

  return (
    <div className="relative group flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
      <Input
        type="text"
        placeholder="Search title, author, subject..."
        value={state.search}
        onChange={(e) => actions.setSearch(e.target.value)}
        className="pl-9 h-9 text-xs border-muted-foreground/20 focus-visible:ring-primary/20 bg-background/50 hover:bg-background transition-colors w-full"
      />
    </div>
  );
};

// Catalog Type Filter Component
FilterBar.Type = function FilterBarType() {
  const { state, actions } = useFilters();

  return (
    <Select value={state.catalogType} onValueChange={actions.setCatalogType}>
      <SelectTrigger className="h-9 min-w-[140px] flex-1 bg-background/50 hover:bg-background border-muted-foreground/20 transition-colors">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="truncate text-xs">
            {state.catalogType === "all"
              ? "All Types"
              : state.catalogType.replace("Karya Ilmiah - ", "").slice(0, 20)}
          </span>
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Catalog Types</SelectItem>
        {CATALOG_TYPES.slice(1).map((type) => (
          <SelectItem key={type} value={type}>
            {type}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Year Range Filter Component
FilterBar.YearRange = function FilterBarYearRange() {
  const { state, actions } = useFilters();

  return (
    <div className="flex gap-2 flex-1 min-w-[200px]">
      {/* Year From */}
      <Select value={state.yearFrom} onValueChange={actions.setYearFrom}>
        <SelectTrigger className="h-9 min-w-[100px] flex-1 bg-background/50 hover:bg-background border-muted-foreground/20 transition-colors text-xs">
          <SelectValue placeholder="From" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">From: Any</SelectItem>
          {YEARS.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Year To */}
      <Select value={state.yearTo} onValueChange={actions.setYearTo}>
        <SelectTrigger className="h-9 min-w-[100px] flex-1 bg-background/50 hover:bg-background border-muted-foreground/20 transition-colors text-xs">
          <SelectValue placeholder="To" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">To: Any</SelectItem>
          {YEARS.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// Subject Filter Component
interface FilterBarSubjectProps {
  availableSubjects: string[];
}

FilterBar.Subject = function FilterBarSubject({
  availableSubjects,
}: FilterBarSubjectProps) {
  const { state, actions } = useFilters();

  if (availableSubjects.length === 0) {
    return null;
  }

  return (
    <Select value={state.subject} onValueChange={actions.setSubject}>
      <SelectTrigger className="h-8 w-[180px] sm:w-[200px] bg-background/30 hover:bg-background border-muted-foreground/15 text-[11px] font-medium">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Tag className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="truncate">
            {state.subject === "all" ? "All Subjects" : state.subject}
          </span>
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Every Subject</SelectItem>
        {availableSubjects.slice(0, 50).map((subj) => (
          <SelectItem key={subj} value={subj}>
            {subj}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Editor (Lecturer) Filter Component
interface FilterBarEditorProps {
  availableEditors?: string[];
}

FilterBar.Editor = function FilterBarEditor({
  availableEditors = [],
}: FilterBarEditorProps) {
  const { state, actions } = useFilters();

  return (
    <Select value={state.editor} onValueChange={actions.setEditor}>
      <SelectTrigger className="h-8 w-[180px] sm:w-[200px] bg-background/30 hover:bg-background border-muted-foreground/15 text-[11px] font-medium">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <User className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="truncate">
            {state.editor === "all" ? "All Lecturers" : state.editor}
          </span>
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Lecturers</SelectItem>
        {availableEditors.length > 0 ? (
          availableEditors.slice(0, 50).map((editor) => (
            <SelectItem key={editor} value={editor}>
              {editor}
            </SelectItem>
          ))
        ) : (
          <SelectItem value="loading" disabled>
            Type to search lecturers...
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};
