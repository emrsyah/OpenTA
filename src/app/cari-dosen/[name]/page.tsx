"use client";

import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  GraduationCap,
  Loader2,
  Tag,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface Paper {
  id: number;
  title: string;
  author: string | null;
  publicationYear: number | null;
  abstract: string | null;
  subject: string | null;
  catalogNumber: string | null;
  classificationNumber: string | null;
  publisher: string | null;
  accessLink: string | null;
}

interface LecturerDetail {
  name: string;
  stats: {
    totalPapers: number;
    yearRange: { min: number | null; max: number | null };
    subjects: string[];
    coLecturers: string[];
  };
  papers: Paper[];
}

interface DetailResponse {
  lecturer: LecturerDetail;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface WebSearchResult {
  title: string;
  url: string;
  text?: string;
  publishedDate?: string;
  score?: number;
}

interface WebSearchResults {
  academic: WebSearchResult[];
  publications: WebSearchResult[];
  other: WebSearchResult[];
}

interface WebSearchResponse {
  query: string;
  results: WebSearchResults;
  total: number;
}

export default function LecturerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const name = decodeURIComponent(params.name as string);

  const [data, setData] = useState<DetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [webSearchExpanded, setWebSearchExpanded] = useState(false);
  const [webSearchLoading, setWebSearchLoading] = useState(false);
  const [webSearchResults, setWebSearchResults] = useState<WebSearchResponse | null>(null);
  const [webSearchError, setWebSearchError] = useState<string | null>(null);

  useEffect(() => {
    fetchLecturerData(currentPage);
  }, [name, currentPage]);

  const fetchLecturerData = async (page: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        name: name,
        page: page.toString(),
        limit: "10",
      });

      const response = await fetch(`/api/lecturers/detail?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch lecturer details");
      }

      const result: DetailResponse = await response.json();
      setData(result);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Terjadi kesalahan saat memuat data dosen.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && data && newPage <= data.pagination.totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleWebSearch = async () => {
    if (webSearchLoading || webSearchResults) return;
    
    setWebSearchLoading(true);
    setWebSearchError(null);
    
    try {
      const response = await fetch(`/api/lecturers/web-search?name=${encodeURIComponent(name)}`);
      
      if (!response.ok) {
        throw new Error("Failed to search lecturer information");
      }
      
      const data: WebSearchResponse = await response.json();
      setWebSearchResults(data);
    } catch (err) {
      console.error("Web search error:", err);
      setWebSearchError("Gagal mencari informasi dosen di internet.");
    } finally {
      setWebSearchLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <Card className="p-12 text-center">
            <p className="text-destructive">
              {error || "Data tidak ditemukan"}
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const { lecturer, pagination } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/cari-dosen">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Pencarian
            </Link>
          </Button>

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {lecturer.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                Dosen Pembimbing Skripsi S1
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Stats */}
          <div className="space-y-6">
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistik</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Total Skripsi
                  </span>
                  <span className="font-semibold text-lg">
                    {lecturer.stats.totalPapers}
                  </span>
                </div>

                {lecturer.stats.yearRange.min &&
                  lecturer.stats.yearRange.max && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Rentang Tahun
                      </span>
                      <span className="font-medium">
                        {lecturer.stats.yearRange.min} -{" "}
                        {lecturer.stats.yearRange.max}
                      </span>
                    </div>
                  )}

                <Separator />

                <div>
                  <span className="text-muted-foreground flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4" />
                    Bidang Keahlian
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {lecturer.stats.subjects.map((subject) => (
                      <Badge key={subject} variant="secondary">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>

                {lecturer.stats.coLecturers.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-muted-foreground flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4" />
                        Dosen Bersama
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {lecturer.stats.coLecturers.slice(0, 5).map((co) => (
                          <Badge key={co} variant="outline" className="text-xs">
                            {co}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Web Search Card */}
            <WebSearchCard
              name={lecturer.name}
              isExpanded={webSearchExpanded}
              onToggle={() => setWebSearchExpanded(!webSearchExpanded)}
              isLoading={webSearchLoading}
              results={webSearchResults}
              error={webSearchError}
              onSearch={handleWebSearch}
            />
          </div>

          {/* Main Content - Papers List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Daftar Skripsi yang Dibimbing
              </h2>
              <span className="text-sm text-muted-foreground">
                Halaman {pagination.page} dari {pagination.totalPages}
              </span>
            </div>

            {lecturer.papers.length > 0 ? (
              <>
                <div className="space-y-4">
                  {lecturer.papers.map((paper) => (
                    <PaperCard key={paper.id} paper={paper} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Sebelumnya
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, pagination.totalPages) },
                        (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={
                                currentPage === pageNum ? "default" : "outline"
                              }
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        },
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                    >
                      Selanjutnya
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="p-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Tidak ada skripsi ditemukan untuk dosen ini.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PaperCard({ paper }: { paper: Paper }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <h3 className="text-lg font-semibold mb-2">{paper.title}</h3>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            {paper.author || "Penulis tidak diketahui"}
          </span>
          {paper.publicationYear && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {paper.publicationYear}
            </span>
          )}
          {paper.catalogNumber && (
            <span className="font-mono text-xs">{paper.catalogNumber}</span>
          )}
        </div>

        {paper.subject && (
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm">{paper.subject}</span>
          </div>
        )}

        {paper.abstract && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {paper.abstract}
          </p>
        )}

        {paper.accessLink && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="w-full sm:w-auto"
          >
            <a
              href={paper.accessLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-2" />
              Akses Skripsi
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function WebSearchCard({
  name,
  isExpanded,
  onToggle,
  isLoading,
  results,
  error,
  onSearch,
}: {
  name: string;
  isExpanded: boolean;
  onToggle: () => void;
  isLoading: boolean;
  results: WebSearchResponse | null;
  error: string | null;
  onSearch: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      {/* Header - Collapsible */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          <span className="font-semibold">Cari di Internet</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Content */}
      {isExpanded && (
        <CardContent className="pt-0 pb-4 px-4 border-t">
          {/* Search Button */}
          {!results && !isLoading && (
            <div className="py-4">
              <Button
                onClick={onSearch}
                className="w-full"
                variant="secondary"
              >
                <Globe className="w-4 h-4 mr-2" />
                Cari "{name}" di Internet
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Mencari profil akademik SINTA, Google Scholar, dan publikasi
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="py-8 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Mencari informasi dosen...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="py-4 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={onSearch} className="mt-2">
                Coba Lagi
              </Button>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-4 pt-4">
              {/* Academic Profiles */}
              {results.results.academic.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Profil Akademik</span>
                    <Badge variant="secondary" className="text-xs">
                      {results.results.academic.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {results.results.academic.map((result, idx) => (
                      <a
                        key={idx}
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors group"
                      >
                        <ExternalLink className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-primary group-hover:underline line-clamp-2">
                            {result.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {new URL(result.url).hostname}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Publications */}
              {results.results.publications.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BookMarked className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Publikasi</span>
                    <Badge variant="secondary" className="text-xs">
                      {results.results.publications.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {results.results.publications.map((result, idx) => (
                      <a
                        key={idx}
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors group"
                      >
                        <ExternalLink className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-primary group-hover:underline line-clamp-2">
                            {result.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {new URL(result.url).hostname}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Results */}
              {results.results.other.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Lainnya</span>
                    <Badge variant="secondary" className="text-xs">
                      {results.results.other.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {results.results.other.slice(0, 3).map((result, idx) => (
                      <a
                        key={idx}
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors group"
                      >
                        <ExternalLink className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-primary group-hover:underline line-clamp-2">
                            {result.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {new URL(result.url).hostname}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {results.total === 0 && (
                <div className="py-4 text-center">
                  <Globe className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Tidak ada hasil ditemukan
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-4" />
          <div className="flex items-start gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-6 w-48" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-5">
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-16 w-full" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
