import { AlertTriangle } from "lucide-react";
import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselHeader,
  InlineCitationCarouselIndex,
  InlineCitationCarouselItem,
  InlineCitationCarouselNext,
  InlineCitationCarouselPrev,
  InlineCitationSource,
} from "@/components/ai-elements/inline-citation";
import { Badge } from "@/components/ui/badge";
import { HoverCardTrigger } from "@/components/ui/hover-card";
import type { CitationAuditResult, Source } from "@/hooks/use-streaming-chat";

interface CitationHoverCardProps {
  nums: number[];
  sources: Source[];
  citationAudit?: CitationAuditResult;
}

/**
 * Hover card component for displaying citation references
 * Shows a badge with citation numbers that opens a carousel on hover
 */
export function CitationHoverCard({
  nums,
  sources,
  citationAudit,
}: CitationHoverCardProps) {
  const isInvalid =
    citationAudit &&
    !citationAudit.isClean &&
    citationAudit.hallucinatedNumbers.includes(nums[0]);

  return (
    <InlineCitation>
      <InlineCitationCard>
        <HoverCardTrigger asChild>
          <Badge
            className="mx-0.5 cursor-pointer rounded-full align-middle text-xs"
            variant="secondary"
            title={
              isInvalid
                ? "Source not found - this citation may be hallucinated"
                : undefined
            }
          >
            {nums.join(", ")}
            {isInvalid && (
              <AlertTriangle className="ml-1 size-3 text-amber-500" />
            )}
          </Badge>
        </HoverCardTrigger>
        <InlineCitationCardBody>
          <InlineCitationCarousel>
            <InlineCitationCarouselHeader>
              <InlineCitationCarouselPrev />
              <InlineCitationCarouselIndex />
              <InlineCitationCarouselNext />
            </InlineCitationCarouselHeader>
            <InlineCitationCarouselContent>
              {sources.map((s) => (
                <InlineCitationCarouselItem key={s.id}>
                  <InlineCitationSource
                    title={s.title}
                    description={s.abstract}
                    url={`https://openlibrary.telkomuniversity.ac.id/home/catalog/id/${(s.id).split("_")[1]}`}
                  >
                    <p className="text-muted-foreground text-xs">
                      {s.authors.slice(0, 3).join(", ")}
                      {s.authors.length > 3 ? " et al." : ""} &bull; {s.year}
                    </p>
                  </InlineCitationSource>
                </InlineCitationCarouselItem>
              ))}
            </InlineCitationCarouselContent>
          </InlineCitationCarousel>
        </InlineCitationCardBody>
      </InlineCitationCard>
    </InlineCitation>
  );
}
