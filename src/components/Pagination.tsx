type Props = {
  pages: number[];
  currentPage?: number;
};

export default function Pagination({ pages, currentPage = 1 }: Props) {
  return (
    <nav className="mt-6 flex items-center justify-center gap-2" aria-label="ページネーション">
      <button
        type="button"
        className="h-10 min-w-[52px] px-3 rounded-xl border border-coffee-200 bg-white text-coffee-800 transition disabled:opacity-40"
        disabled
      >
        ← 前へ
      </button>
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          className={`h-10 min-w-[42px] px-3 rounded-xl border transition ${
            page === currentPage
              ? "bg-coffee-800 text-white border-coffee-800"
              : "bg-white text-coffee-800 border-coffee-200 hover:bg-cream-200/60"
          }`}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        className="h-10 min-w-[52px] px-3 rounded-xl border border-coffee-200 bg-white text-coffee-800 transition disabled:opacity-40"
      >
        次へ →
      </button>
    </nav>
  );
}
