import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OSAKA CAFE FINDER",
  description:
    "大阪のカフェを紙のようなテクスチャとフィルターUIで探せるランディングページ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
