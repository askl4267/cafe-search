import { Suspense } from "react";

import ShopContent from "./ShopContent";

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-50 bg-cream-100/80 backdrop-blur border-b border-coffee-200">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
              <div className="text-sm text-coffee-700">Loading...</div>
            </div>
          </header>
          <main className="flex-grow max-w-5xl mx-auto px-4 py-16 text-center">
            <p className="text-sm text-coffee-600">ページを読み込み中です…</p>
          </main>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
