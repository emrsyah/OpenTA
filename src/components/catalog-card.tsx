"use client";

import {
  Archive,
  Bookmark,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Hash,
  Tag,
  User,
} from "lucide-react";
import { memo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

interface CatalogItem {
  id: number;
  title: string;
  abstract: string | null;
  catalogNumber: string | null;
  catalogType: string | null;
  classificationNumber: string | null;
  subject: string | null;
  author: string | null;
  editor: string | null;
  publisher: string | null;
  shelfNumber: string | null;
  libraryLocation: string | null;
  publicationYear: number | null;
  totalCopies: number | null;
  accessLink: string | null;
}

type ViewMode = "grid" | "list";

interface CatalogCardProps {
  item: CatalogItem;
  viewMode: ViewMode;
}

export const CatalogCard = memo(
  function CatalogCard({ item, viewMode }: CatalogCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const getCatalogTypeBadgeColor = (type: string | null) => {
      if (!type) return "default";
      if (type.includes("Skripsi")) return "default";
      if (type.includes("Thesis")) return "secondary";
      if (type.includes("Disertasi")) return "outline";
      if (type.includes("E-Book")) return "default";
      if (type.includes("Jurnal")) return "secondary";
      return "outline";
    };

    const isListView = viewMode === "list";

    return (
      <Card
        className={`overflow-hidden hover:shadow-lg transition-all duration-300 group ${
          isListView ? "flex flex-row md:flex-row flex-col" : "flex flex-col"
        }`}
      >
        <CardHeader className={isListView ? "flex-1" : ""}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <CardTitle
              className={`line-clamp-2 flex-1 ${isListView ? "text-xl" : "text-lg"}`}
            >
              {item.title}
            </CardTitle>
          </div>
          {item.catalogType ? (
            <Badge
              variant={getCatalogTypeBadgeColor(item.catalogType)}
              className="w-fit text-xs"
            >
              {item.catalogType}
            </Badge>
          ) : null}
        </CardHeader>

        <CardContent
          className={`flex-1 space-y-2 ${isListView ? "flex-1" : ""}`}
        >
          {/* Always visible fields */}
          {item.author ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4 shrink-0" />
              <span className="line-clamp-1">{item.author}</span>
            </div>
          ) : null}
          {item.publicationYear ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>{item.publicationYear}</span>
            </div>
          ) : null}
          {item.subject ? (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Tag className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{item.subject}</span>
            </div>
          ) : null}
          {item.libraryLocation ? (
            <div className="text-sm text-muted-foreground">
              📍 {item.libraryLocation}
            </div>
          ) : null}

          {/* Expandable details */}
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-primary hover:text-primary/80 hover:bg-primary/10"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Show Details
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-2">
              <Separator />
              <div className="space-y-2 pt-2">
                {item.abstract ? (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                      <Archive className="w-3 h-3" />
                      Abstract
                    </p>
                    <p className="text-sm leading-relaxed line-clamp-4">
                      {item.abstract}
                    </p>
                  </div>
                ) : null}
                {item.catalogNumber ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Hash className="w-4 h-4 shrink-0" />
                    <span className="text-xs">Catalog:</span>
                    <span className="font-mono">{item.catalogNumber}</span>
                  </div>
                ) : null}
                {item.classificationNumber ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Bookmark className="w-4 h-4 shrink-0" />
                    <span className="text-xs">Classification:</span>
                    <span>{item.classificationNumber}</span>
                  </div>
                ) : null}
                {item.editor ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4 shrink-0" />
                    <span className="text-xs">Editor:</span>
                    <span>{item.editor}</span>
                  </div>
                ) : null}
                {item.publisher ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span className="text-xs">Publisher:</span>
                    <span>{item.publisher}</span>
                  </div>
                ) : null}
                {item.shelfNumber ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Bookmark className="w-4 h-4 shrink-0" />
                    <span className="text-xs">Shelf:</span>
                    <span className="font-mono">{item.shelfNumber}</span>
                  </div>
                ) : null}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>

        <CardFooter className="flex gap-2 pt-4 border-t">
          {item.accessLink ? (
            <Button asChild className="flex-1" size="sm">
              <a
                href={item.accessLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Access
              </a>
            </Button>
          ) : (
            <Button variant="outline" className="flex-1" size="sm" disabled>
              {item.totalCopies && item.totalCopies > 0
                ? `${item.totalCopies} copies`
                : "Not available"}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for memo - only re-render if item.id or viewMode changes
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.viewMode === nextProps.viewMode
    );
  },
);
