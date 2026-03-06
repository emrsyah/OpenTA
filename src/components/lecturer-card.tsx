"use client";

import { BookOpen, Calendar, ChevronRight, Tag, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LecturerResult {
  name: string;
  paperCount: number;
  relevanceScore: number;
  stats: {
    totalPapers: number;
    yearRange: { min: number | null; max: number | null };
    subjects: string[];
  };
  topPapers: Array<{
    id: number;
    title: string;
    author: string | null;
    publicationYear: number | null;
    abstract: string | null;
    subject: string | null;
  }>;
}

interface LecturerCardProps {
  lecturer: LecturerResult;
  onViewDetail: () => void;
}

export function LecturerCard({ lecturer, onViewDetail }: LecturerCardProps) {
  const { name, paperCount, stats, topPapers } = lecturer;

  // Calculate relevance percentage (mock calculation based on paper count and recency)
  const relevancePercent = Math.min(
    95,
    Math.max(50, Math.round((paperCount / 15) * 100)),
  );

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                {name}
              </h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {paperCount} skripsi terkait
                </span>
                {stats.yearRange.min && stats.yearRange.max && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {stats.yearRange.min} - {stats.yearRange.max}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-primary">
              {relevancePercent}%
            </div>
            <div className="text-xs text-muted-foreground">Relevansi</div>
          </div>
        </div>

        {/* Subjects */}
        {stats.subjects.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <Tag className="w-3.5 h-3.5" />
              <span>Bidang Keahlian:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {stats.subjects.slice(0, 5).map((subject) => (
                <Badge key={subject} variant="secondary" className="text-xs">
                  {subject}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Top Papers Preview */}
        {topPapers.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs font-medium text-muted-foreground">
              Skripsi Terkait:
            </p>
            {topPapers.slice(0, 2).map((paper) => (
              <div
                key={paper.id}
                className="text-sm p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <p className="font-medium line-clamp-1">{paper.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{paper.author || "Penulis tidak diketahui"}</span>
                  {paper.publicationYear && (
                    <>
                      <span>•</span>
                      <span>{paper.publicationYear}</span>
                    </>
                  )}
                </div>
                {paper.abstract && (
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                    {paper.abstract}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <Button
          variant="outline"
          className="w-full group/btn"
          onClick={onViewDetail}
        >
          <span>Lihat Semua {paperCount} Skripsi</span>
          <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
}
