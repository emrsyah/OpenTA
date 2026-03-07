"use client";

import { BookOpen, GraduationCap, Loader2, Search, Sparkles, Users, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { useDebouncedCallback } from "use-debounce";
import { LecturerCard } from "@/components/lecturer-card";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LecturerResult, SearchResponse } from "@/types/lecturer";

type SearchMode = "keyword" | "semantic";



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
  const [hasSearched, setHasSearched] = useState(false);

  // Fetcher for SWR
  const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Terjadi kesalahan saat mencari dosen");
    }
    return res.json() as Promise<SearchResponse>;
  };

  const params = new URLSearchParams({
    topic: topic.trim(),
    limit: "20",
    minPapers: "1",
    searchMode: searchMode,
  });

  // Enable SWR based on conditions (topic.length > 0 && hasSearched)
  const shouldFetch = hasSearched && topic.trim().length > 0;

  const { data: results, error: swrError, isLoading: swrLoading } = useSWR<SearchResponse>(
    shouldFetch ? `/api/lecturers/search?${params}` : null,
    fetcher,
    { keepPreviousData: true, revalidateOnFocus: false }
  );

  const error = swrError?.message || null;
  const isSearching = swrLoading;

  const debouncedSearch = useDebouncedCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTopic(e.target.value);
    if (e.target.value.trim().length > 0) {
      setHasSearched(true);
    } else {
      setHasSearched(false);
    }
  }, 500);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim().length > 0) {
      setHasSearched(true);
    }
  };

  const handleExampleClick = (example: string) => {
    setTopic(example);
    setHasSearched(true);
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
                  defaultValue={topic}
                  onChange={debouncedSearch}
                  className="pl-12 pr-[180px] py-6 text-lg rounded-xl border-2 border-border/50 focus:border-primary transition-colors"
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
