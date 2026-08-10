'use client';

import { useMemo, useState } from 'react';

export function useClientPagination<T>(items: T[], initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pageItems = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize],
  );

  const setPageSizeAndReset = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const resetPage = () => setPage(1);

  return {
    page: currentPage,
    pageSize,
    total,
    pageItems,
    setPage,
    setPageSize: setPageSizeAndReset,
    resetPage,
  };
}
