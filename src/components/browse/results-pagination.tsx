"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ResultsPaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  itemsCount: number;
  loading?: boolean;
}

export function ResultsPagination({
  pagination,
  onPageChange,
  itemsCount,
  loading = false,
}: ResultsPaginationProps) {
  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const { page, totalPages } = pagination;
    const pages: number[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (page <= 3) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
    } else if (page >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      for (let i = page - 2; i <= page + 2; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  return (
    <>
      {/* Results Count */}
      <div className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
        {loading ? (
          <Skeleton className="h-3.5 w-24" />
        ) : (
          <span>
            <span className="text-foreground font-bold">
              {itemsCount > 0
                ? (pagination.page - 1) * pagination.limit + 1
                : 0}
              -{Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>
            <span> of </span>
            <span className="text-foreground font-bold">
              {pagination.total.toLocaleString()}
            </span>
          </span>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Previous
          </Button>
          <div className="flex gap-1">
            {generatePageNumbers().map((pageNum) => (
              <Button
                key={pageNum}
                variant={pagination.page === pageNum ? "default" : "outline"}
                onClick={() => onPageChange(pageNum)}
                size="sm"
              >
                {pageNum}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}
