'use client';

import { Fragment } from 'react';

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = new Set<number>();
  pages.add(1);
  const start = Math.max(2, page - 2);
  const end = Math.min(totalPages - 1, page + 2);
  for (let current = start; current <= end; current++) {
    pages.add(current);
  }
  if (totalPages > 1) {
    pages.add(totalPages);
  }

  const sortedPages = Array.from(pages).sort((a, b) => a - b);

  return (
    <div className="flex flex-col items-center gap-2">
      <nav className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-10 min-w-[2.5rem] rounded-xl border border-coffee-200 bg-white px-3 text-sm text-coffee-800 transition hover:bg-cream-200/60 disabled:opacity-40"
        >
          前へ
        </button>
        {sortedPages.map((value, index) => {
          const prev = sortedPages[index - 1] ?? -1;
          return (
            <Fragment key={value}>
              {index > 0 && value !== prev + 1 && (
                <span className="px-2 text-coffee-500">…</span>
              )}
              <button
                type="button"
                onClick={() => onPageChange(value)}
                disabled={value === page}
                className={`h-10 min-w-[2.5rem] rounded-xl border px-3 text-sm transition ${
                  value === page
                    ? 'bg-coffee-800 text-white border-coffee-800'
                    : 'border-coffee-200 bg-white text-coffee-800 hover:bg-cream-200/60'
                }`}
              >
                {value}
              </button>
            </Fragment>
          );
        })}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-10 min-w-[2.5rem] rounded-xl border border-coffee-200 bg-white px-3 text-sm text-coffee-800 transition hover:bg-cream-200/60 disabled:opacity-40"
        >
          次へ
        </button>
      </nav>
      <div className="w-full text-center text-sm text-coffee-600">
        {page}/{totalPages}ページ
      </div>
    </div>
  );
}
