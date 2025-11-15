import { ReactNode } from 'react';
import './globals.css';
import { M_PLUS_Rounded_1c, Shippori_Mincho } from 'next/font/google';

const sans = M_PLUS_Rounded_1c({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-sans' });
const display = Shippori_Mincho({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-display' });

export const metadata = {
  title: 'Osaka Cafe Finder',
  description: 'Cloudflare Workers API にアクセスする大阪のカフェ検索アプリ',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" className={`${sans.variable} ${display.variable}`}>
      <body className="bg-transparent text-coffee-900">
        <div className="min-h-screen">
          <header className="sticky top-0 z-50 border-b border-coffee-200 bg-cream-100/80 backdrop-blur">
            <div className="max-w-7xl mx-auto flex items-center gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-coffee-600" />
                <p className="font-display text-2xl tracking-wide">Osaka Cafe Finder</p>
              </div>
              <p className="ml-auto text-xs text-coffee-500">Powered by Hot Pepper</p>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
