import { usePagination } from "~/hooks/use-pagination";

import { Button } from "../../../../components/ui/button";

const DOTS = "...";

type Props = {
  onPageChange: (page: number) => void;
  totalCount: number;
  siblingCount?: number;
  currentPage: number;
  pageSize: number;
};

export function Pagination({
  onPageChange,
  totalCount,
  siblingCount = 1,
  currentPage,
  pageSize,
}: Props) {
  const paginationRange = usePagination({
    currentPage,
    totalCount,
    siblingCount,
    pageSize,
  });

  const totalPageCount = Math.ceil(totalCount / pageSize);

  if (currentPage === 0 || totalPageCount < 2) {
    return null;
  }

  const onNext = () => {
    onPageChange(currentPage + 1);
  };

  const onPrevious = () => {
    onPageChange(currentPage - 1);
  };

  return (
    <div className="flex items-center justify-center gap-2 py-6">
      <Button onClick={onPrevious} disabled={currentPage <= 1} size="sm">
        Previous
      </Button>
      <div className="flex items-center gap-1">
        {paginationRange?.map((pageNumber, index) => {
          if (pageNumber === DOTS) {
            return (
              <span key={`${DOTS}-${index}`} className="px-2 py-1 text-sm">
                &#8230;
              </span>
            );
          }

          return (
            <Button
              key={pageNumber}
              onClick={() => onPageChange(pageNumber as number)}
              variant={pageNumber === currentPage ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
            >
              {pageNumber}
            </Button>
          );
        })}
      </div>
      <Button
        onClick={onNext}
        disabled={currentPage >= totalPageCount}
        size="sm"
      >
        Next
      </Button>
    </div>
  );
}
