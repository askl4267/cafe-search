import type { Metadata } from "next";
import { M_PLUS_Rounded_1c, Shippori_Mincho } from "next/font/google";
import "./globals.css";

const mPlusRounded = M_PLUS_Rounded_1c({
  subsets: ["latin", "japanese"],
  weight: ["400", "500", "700"],
  variable: "--font-m-plus",
});

const shipporiMincho = Shippori_Mincho({
  subsets: ["latin", "japanese"],
  weight: ["600", "700"],
  variable: "--font-shippori",
});

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
      <body
        className={`${mPlusRounded.variable} ${shipporiMincho.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
