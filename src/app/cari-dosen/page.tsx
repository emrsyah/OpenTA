"use client";

import {
  BookOpen,
  GraduationCap,
  Loader2,
  Search,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { LecturerCard } from "@/components/lecturer-card";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type SearchMode = "keyword" | "semantic";

interface LecturerResult {
  name: string;
  paperCount: number;
  relevanceScore: number;
  searchMethod: "vector" | "fulltext";
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

interface SearchResponse {
  lecturers: LecturerResult[];
  total: number;
  query: {
    topic: string;
    lecturerName: string;
  };
  searchMethod: "vector" | "fulltext";
}

const EXAMPLE_TOPICS = [
  "machine learning untuk prediksi churn pelanggan",
  "sistem rekomendasi film menggunakan collaborative filtering",
  "keamanan jaringan komputer menggunakan blockchain",
  "analisis sentimen review aplikasi mobile",
  "optimasi rute pengiriman menggunakan algoritma genetika",
];

const SEARCH_MODE_CONFIG = {
  keyword: {
    label: "Kata Kunci",
    icon: Zap,
    description: "Cepat (2-3 detik)",
    detail: "Pencarian berdasarkan kata kunci eksak",
  },
  semantic: {
    label: "Semantik (AI)",
    icon: Sparkles,
    description: "Lebih dalam (5-10 detik)",
    detail: "Pencarian berbasis AI yang memahami makna",
  },
} as const;

export default function CariDosenPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("keyword");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchLecturers = useCallback(
    async (searchTopic: string, mode: SearchMode) => {
      if (!searchTopic.trim()) return;

      setIsSearching(true);
      setError(null);
      setHasSearched(true);

      try {
        const params = new URLSearchParams({
          topic: searchTopic,
          limit: "20",
          minPapers: "1",
          searchMode: mode,
        });

        const response = await fetch(`/api/lecturers/search?${params}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || "Terjadi kesalahan saat mencari dosen",
          );
        }

        const data: SearchResponse = await response.json();
        setResults(data);
      } catch (err) {
        console.error("Search error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat mencari dosen. Silakan coba lagi.",
        );
      } finally {
        setIsSearching(false);
      }
    },
    [],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchLecturers(topic, searchMode);
  };

  const handleExampleClick = (example: string) => {
    setTopic(example);
    searchLecturers(example, searchMode);
  };

  const handleViewLecturer = (name: string) => {
    router.push(`/cari-dosen/${encodeURIComponent(name)}`);
  };

  const currentModeConfig = SEARCH_MODE_CONFIG[searchMode];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <GraduationCap className="w-4 h-4" />
              <span>Tersedia Untuk Mahasiswa S1</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Cari Dosen Pembimbing
            </h1>

            <p className="text-muted-foreground text-lg mb-8">
              Temukan dosen pembimbing yang sesuai dengan topik penelitianmu.
              Sistem akan mencocokkan topikmu dengan skripsi yang pernah
              dibimbing.
            </p>

            {/* Search Mode Toggle */}
            <div className="mb-6">
              <div className="flex items-center justify-center gap-1 p-1 bg-muted/50 rounded-lg w-fit mx-auto">
                {(Object.keys(SEARCH_MODE_CONFIG) as SearchMode[]).map(
                  (mode) => {
                    const config = SEARCH_MODE_CONFIG[mode];
                    const Icon = config.icon;
                    const isActive = searchMode === mode;

                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setSearchMode(mode)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                          isActive
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-4 h-4",
                            isActive && mode === "semantic" && "text-primary",
                          )}
                        />
                        <span>{config.label}</span>
                      </button>
                    );
                  },
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {currentModeConfig.detail} • {currentModeConfig.description}
              </p>
            </div>

            {/* Search Form */}
            <form
              onSubmit={handleSearch}
              className="relative max-w-2xl mx-auto"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Masukkan topik penelitianmu..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="pl-12 pr-32 py-6 text-lg rounded-xl border-2 border-border/50 focus:border-primary transition-colors"
                />
                <Button
                  type="submit"
                  disabled={isSearching || !topic.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {searchMode === "semantic"
                        ? "Menganalisis..."
                        : "Mencari..."}
                    </>
                  ) : (
                    <>
                      {searchMode === "semantic" ? (
                        <Sparkles className="w-4 h-4 mr-2" />
                      ) : (
                        <Search className="w-4 h-4 mr-2" />
                      )}
                      {searchMode === "semantic" ? "Analisis" : "Cari"}
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Example Topics */}
            {!hasSearched && (
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-3">
                  Contoh topik:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {EXAMPLE_TOPICS.map((example) => (
                    <button
                      key={example}
                      onClick={() => handleExampleClick(example)}
                      className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors text-secondary-foreground"
                    >
                      {example.length > 40
                        ? example.slice(0, 40) + "..."
                        : example}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="container mx-auto px-4 py-8">
        {error && (
          <Card className="max-w-2xl mx-auto border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive text-center">{error}</p>
            </CardContent>
          </Card>
        )}

        {isSearching && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-6 w-24" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-64" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                  <Skeleton className="h-20 w-full" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isSearching && hasSearched && results && (
          <div className="max-w-4xl mx-auto">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Hasil Pencarian</h2>
                <p className="text-sm text-muted-foreground">
                  {results.total} dosen ditemukan untuk topik &quot;
                  {results.query.topic}&quot;
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Diurutkan berdasarkan relevansi</span>
                </div>
                {results.searchMethod === "vector" && (
                  <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    <span>Semantik (AI)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Lecturer Cards */}
            {results.lecturers.length > 0 ? (
              <div className="space-y-4">
                {results.lecturers.map((lecturer) => (
                  <LecturerCard
                    key={lecturer.name}
                    lecturer={lecturer}
                    onViewDetail={() => handleViewLecturer(lecturer.name)}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Tidak ada dosen ditemukan
                </h3>
                <p className="text-muted-foreground">
                  Coba gunakan kata kunci yang berbeda atau lebih umum untuk
                  menemukan dosen yang sesuai.
                </p>
              </Card>
            )}
          </div>
        )}

        {!hasSearched && !isSearching && (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Siap Mencari Dosen Pembimbing?
            </h3>
            <p className="text-muted-foreground">
              Masukkan topik penelitianmu di atas untuk menemukan dosen yang
              paling sesuai dengan bidang keilmuanmu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
