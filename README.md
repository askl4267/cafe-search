# 大阪カフェ検索

大阪エリアのカフェを検索・比較できる Web アプリです。Hot Pepper と Google Places のデータを Cloudflare D1（Managed SQLite）へ蓄積し、Cloudflare Workers で API 化。フロントは軽量な HTML/JS + Tailwind CSS で構築しています。

> Live: `https://cafe-search.pages.dev`（公開中）

---

## 目次
- [開発背景](#開発背景)
- [主要機能](#主要機能)
- [使用技術](#使用技術)
- [技術選定の理由](#技術選定の理由)
- [画面](#画面)
- [開発ルール](#開発ルール)
- [今後の開発について](#今後の開発について)

---

## 開発背景
- **目的**：ポートフォリオとして、データ連携 → API → UI まで一気通貫の実装力を提示する。
- **課題感**：レビューや店舗情報は分散しており、ユーザーの**「気分」**（コーヒー重視 / スイーツ重視 / ゆっくり 等）に沿った発見体験が弱い。
- **アプローチ**：
  - 公開 API（Hot Pepper / Google Places）＋自前スキーマ（D1/SQLite）で**再利用可能なデータ基盤**を用意。
  - Workers で**低レイテンシな API**を提供し、Cloudflare Pages で**グローバル配信**。
  - シンプルなフロントで**初期描画を高速化**しつつ、UI を段階的に拡張。

---

## 主要機能
- **検索・絞り込み**：エリア（中/小）やジャンル、キーワードでの検索。
- **気分ベースの並び替え（予定）**：`coffee/sweets/food/openness/stylish` のスコアでソート。
- **詳細ページ**：基本情報、営業時間、写真、レビュー（Google Places）を表示。
- **類似カフェ推薦（予定）**：テキスト・属性の類似度に基づく推薦。
- **突合（内部）**：Hot Pepper と Places の ID 突合テーブル `places_link` を管理。

---

## 使用技術
> 数値は実測/lock からの**確定版**を記載（再現性のため）。

| カテゴリ | 技術 | バージョン | 取得元/備考 |
|---|---|---:|---|
| Hosting | Cloudflare Pages | — | `cafe-search.pages.dev` |
| Build Node | Node.js | **v22.16.0** | Pages のデプロイログ（`node -v`） |
| Package | npm | **10.9.2** | Pages のデプロイログ |
| Styling | Tailwind CSS | **3.4.18** | package-lock.json |
| PostCSS | PostCSS | **8.5.6** | package-lock.json |
| PostCSS | Autoprefixer | **10.4.21** | package-lock.json |
| PostCSS | postcss-import | **15.1.0** | package-lock.json |
| PostCSS | postcss-nested | **6.2.0** | package-lock.json |
| PostCSS | postcss-js | **4.1.0** | package-lock.json |
| PostCSS | postcss-load-config | **6.0.1** | package-lock.json |
| Backend | Cloudflare Workers | **compatibility_date: 2025-10-17** | `api/wrangler.toml` |
| DB | Cloudflare D1 (Managed SQLite) | **（バージョンは非公開）** | D1 は一部関数が無効化（`sqlite_version()`不可） |
| Data Source | Hot Pepper Gourmet API | **ジャンル: G014** | `wrangler.toml [vars]` |
| Data Source | Google Places API | — | Details / Photos / Field Masks |

---

## 技術選定の理由
- **Cloudflare Workers / Pages**：CDN エッジ実行で低レイテンシ、無料〜低コストのスケール。
- **Cloudflare D1**：SQLite 準拠で扱いやすい。スキーマ設計が軽く、個人開発でも運用容易。
- **HTML/JS + Tailwind**：依存を最小化して高速初期表示。CSS 設計コストを削減。
- **Hot Pepper + Places**： **量（Hot Pepper）×質（Places）**で相互補完。口コミ/写真/営業時間を充実させる。
- **Mermaid 図**：ドキュメントをコードで管理し、変更に強い README を維持。

---

## 画面
![TOP](docs/screens/top.png)

---

## 開発ルール
- **ディレクトリ**
  - `/src` … フロント資産
  - `/api` … Workers（API）
  - `index.html` … エントリ
- **コーディング**
  - Prettier/ESLint（導入予定）
  - コミットメッセージ：`feat:`, `fix:`, `docs:` 等の prefix を推奨
- **CI/CD**
  - GitHub Actions で Lint / Build（将来導入）

---

## 今後の開発について
- **スコアリング実装**：`coffee/sweets/food/openness/stylish` の 0–100 推定
  - ルールベース → 軽量 ML（レビュー語彙、メニュー、座席/テラス表現 等）
- **類似推薦**：テキスト/属性のベクトル化 → 近傍検索で類似カフェ表示