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
import type { Source } from "@/hooks/use-streaming-chat";

interface CitationHoverCardProps {
  nums: number[];
  sources: Source[];
}

/**
 * Hover card component for displaying citation references
 * Shows a badge with citation numbers that opens a carousel on hover
 */
export function CitationHoverCard({ nums, sources }: CitationHoverCardProps) {
  return (
    <InlineCitation>
      <InlineCitationCard>
        <HoverCardTrigger asChild>
          <Badge
            className="mx-0.5 cursor-pointer rounded-full align-middle text-xs"
            variant="secondary"
          >
            {nums.join(", ")}
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
