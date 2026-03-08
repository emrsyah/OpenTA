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
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { Badge } from "@/components/ui/badge";
import { HoverCardTrigger } from "@/components/ui/hover-card";
import { groupAndSortSources } from "@/hooks/use-citations";
import type { Source as SourceType } from "@/hooks/use-streaming-chat";
import { SaveButton } from "@/components/save-button";

interface MessageSourcesProps {
  sources: SourceType[];
}

/**
 * Message sources component that displays all cited sources in a collapsible panel
 * Sources are grouped by citation number and displayed in a carousel
 */
export function MessageSources({ sources }: MessageSourcesProps) {
  if (sources.length === 0) {
    return null;
  }

  const sorted = groupAndSortSources(sources);

  return (
    <Sources className="mt-4 border-t border-border pt-3 not-prose text-foreground">
      <SourcesTrigger
        count={sorted.length}
        className="text-muted-foreground hover:text-foreground transition-colors"
      />
      <SourcesContent className="w-full mt-2 gap-1.5">
        {sorted.map((group) => {
          const primary = group[0];
          return (
            <InlineCitation key={primary.citation_number}>
              <InlineCitationCard>
                <HoverCardTrigger asChild>
                  <Source className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    <Badge
                      className="rounded-full shrink-0 text-xs font-mono"
                      variant="secondary"
                    >
                      {primary.citation_number}
                    </Badge>
                    <span className="text-xs truncate max-w-64">
                      {primary.title}
                    </span>
                    <span className="text-xs text-muted-foreground/60 shrink-0 ml-auto">
                      {primary.year}
                    </span>
                  </Source>
                </HoverCardTrigger>
                <InlineCitationCardBody>
                  <InlineCitationCarousel>
                    <InlineCitationCarouselHeader>
                      <InlineCitationCarouselPrev />
                      <InlineCitationCarouselIndex />
                      <InlineCitationCarouselNext />
                    </InlineCitationCarouselHeader>
                    <InlineCitationCarouselContent>
                      {group.map((s) => (
                        <InlineCitationCarouselItem key={s.id}>
                          <InlineCitationSource
                            title={s.title}
                            description={s.abstract}
                          >
                            <p className="text-muted-foreground text-xs">
                              {s.authors.slice(0, 3).join(", ")}
                              {s.authors.length > 3 ? " et al." : ""} &bull;{" "}
                              {s.year}
                            </p>
                            <div className="mt-2">
                              <SaveButton 
                                catalogId={parseInt(s.id, 10)} 
                                variant="badge" 
                                paperTitle={s.title}
                                size="sm"
                              />
                            </div>
                          </InlineCitationSource>
                        </InlineCitationCarouselItem>
                      ))}
                    </InlineCitationCarouselContent>
                  </InlineCitationCarousel>
                </InlineCitationCardBody>
              </InlineCitationCard>
            </InlineCitation>
          );
        })}
      </SourcesContent>
    </Sources>
  );
}
