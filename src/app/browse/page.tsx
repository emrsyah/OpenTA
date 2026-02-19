"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  BookOpen,
  ExternalLink,
  Calendar,
  User,
  Tag,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// Catalog types from schema
const CATALOG_TYPES = [
  "all",
  "Karya Ilmiah - Skripsi (S1) - Reference",
  "Karya Ilmiah - Thesis (S2) - Reference",
  "Karya Ilmiah - Disertasi (S3) - Reference",
  "Buku - Elektronik (E-Book)",
  "Jurnal Internasional - Reference",
  "Jurnal Nasional - Reference",
  "Artikel - Restricted Use",
  "Proceeding ( Electronic )",
] as const;

const YEARS = Array.from(
  { length: 30 },
  (_, i) => new Date().getFullYear() - i,
);

interface CatalogItem {
  id: number;
  title: string;
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

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function Browse() {
  const [search, setSearch] = useState("");
  const [catalogType, setCatalogType] = useState("all");
  const [yearFrom, setYearFrom] = useState("any");
  const [yearTo, setYearTo] = useState("any");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch catalog items
  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          search: debouncedSearch,
          type: catalogType,
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
        });

        if (yearFrom && yearFrom !== "any") params.append("yearFrom", yearFrom);
        if (yearTo && yearTo !== "any") params.append("yearTo", yearTo);

        const response = await fetch(`/api/catalog?${params}`);
        const data = await response.json();

        setItems(data.items || []);
        setPagination(data.pagination);
      } catch (error) {
        console.error("Failed to fetch catalog:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [debouncedSearch, catalogType, yearFrom, yearTo, pagination.page]);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getCatalogTypeBadgeColor = (type: string | null) => {
    if (!type) return "default";
    if (type.includes("Skripsi")) return "default";
    if (type.includes("Thesis")) return "secondary";
    if (type.includes("Disertasi")) return "outline";
    if (type.includes("E-Book")) return "default";
    if (type.includes("Jurnal")) return "secondary";
    return "outline";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            Browse Catalog
          </h1>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by title, author, or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            {/* Type Filter */}
            <Select value={catalogType} onValueChange={setCatalogType}>
              <SelectTrigger className="w-full md:w-[280px] h-11">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Catalog Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {CATALOG_TYPES.slice(1).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Year From */}
            <Select value={yearFrom} onValueChange={setYearFrom}>
              <SelectTrigger className="w-full md:w-[140px] h-11">
                <SelectValue placeholder="Year From" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {YEARS.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Year To */}
            <Select value={yearTo} onValueChange={setYearTo}>
              <SelectTrigger className="w-full md:w-[140px] h-11">
                <SelectValue placeholder="Year To" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {YEARS.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-muted-foreground">
            {loading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <span>
                Showing{" "}
                {items.length > 0
                  ? (pagination.page - 1) * pagination.limit + 1
                  : 0}{" "}
                -{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} results
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <>
            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-lg line-clamp-2 flex-1">
                        {item.title}
                      </CardTitle>
                    </div>
                    {item.catalogType && (
                      <Badge
                        variant={getCatalogTypeBadgeColor(item.catalogType)}
                        className="w-fit text-xs"
                      >
                        {item.catalogType}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 space-y-2">
                    {item.author && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4 shrink-0" />
                        <span className="line-clamp-1">{item.author}</span>
                      </div>
                    )}
                    {item.publicationYear && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>{item.publicationYear}</span>
                      </div>
                    )}
                    {item.subject && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Tag className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{item.subject}</span>
                      </div>
                    )}
                    {item.libraryLocation && (
                      <div className="text-sm text-muted-foreground">
                        📍 {item.libraryLocation}
                      </div>
                    )}
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
                      <Button
                        variant="outline"
                        className="flex-1"
                        size="sm"
                        disabled
                      >
                        {item.totalCopies && item.totalCopies > 0
                          ? `${item.totalCopies} copies available`
                          : "Not available"}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pagination.page === pageNum ? "default" : "outline"
                          }
                          onClick={() => handlePageChange(pageNum)}
                          size="sm"
                        >
                          {pageNum}
                        </Button>
                      );
                    },
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
