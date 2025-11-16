type Props = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  const pages = new Set<number>();
  pages.add(1);
  const start = Math.max(2, currentPage - 2);
  const end = Math.min(totalPages - 1, currentPage + 2);
  for (let p = start; p <= end; p++) {
    pages.add(p);
  }
  if (totalPages > 1) {
    pages.add(totalPages);
  }

  const pageList = Array.from(pages).sort((a, b) => a - b);

  return (
    <>
      <nav className="mt-6 flex items-center justify-center gap-2" aria-label="ページネーション">
        <button
          type="button"
          className="h-10 min-w-[52px] px-3 rounded-xl border border-coffee-200 bg-white text-coffee-800 transition disabled:opacity-40"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          ← 前へ
        </button>
        {pageList.map((page, index) => (
          <span key={`page-group-${page}`}>
            {index > 0 && pageList[index - 1] !== page - 1 && (
              <span className="px-2 text-coffee-500">…</span>
            )}
            <button
              type="button"
              className={`h-10 min-w-[42px] px-3 rounded-xl border transition ${
                page === currentPage
                  ? "bg-coffee-800 text-white border-coffee-800"
                  : "bg-white text-coffee-800 border-coffee-200 hover:bg-cream-200/60"
              }`}
              aria-current={page === currentPage ? "page" : undefined}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          </span>
        ))}
        <button
          type="button"
          className="h-10 min-w-[52px] px-3 rounded-xl border border-coffee-200 bg-white text-coffee-800 transition disabled:opacity-40"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          次へ →
        </button>
      </nav>
      <div className="w-full text-center text-sm text-coffee-600 mt-2">
        {currentPage} / {totalPages}ページ
      </div>
    </>
  );
}
