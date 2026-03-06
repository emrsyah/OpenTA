"use client";

import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
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

export default function LecturerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const name = decodeURIComponent(params.name as string);

  const [data, setData] = useState<DetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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
