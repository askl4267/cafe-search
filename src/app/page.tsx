import type { Cafe, MidArea, SmallArea } from "./types";
import Header from "../components/Header";
import FilterPanel from "../components/FilterPanel";
import CafeGrid from "../components/CafeGrid";

const midAreas: MidArea[] = [
  { name: "梅田・堂島", count: 18, selected: true },
  { name: "谷町・天満橋", count: 14, selected: false },
  { name: "中之島", count: 12, selected: false },
  { name: "南船場・心斎橋", count: 20, selected: false },
  { name: "堀江・西長堀", count: 9, selected: false },
];

const smallAreas: SmallArea[] = [
  { name: "中崎町", count: 7, checked: true },
  { name: "中之島公園", count: 4, checked: false },
  { name: "堀江公園", count: 5, checked: false },
  { name: "北浜", count: 6, checked: false },
  { name: "南船場", count: 3, checked: false },
  { name: "御堂筋本町", count: 5, checked: false },
];

const cafeCards: Cafe[] = [
  {
    name: "Cafe & Roastery 初雪",
    description: "焙煎所併設のカフェ。木のカウンター越しにシングルオリジンを楽しめる。",
    address: "大阪市北区中崎町2-3-12",
    parking: "近隣コインP",
    wifi: "あり",
    nonSmoking: "全面禁煙",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "北浜フィールドリビング",
    description: "川を望むテラスが自慢。ラテアートからブランチまで。",
    address: "大阪市中央区北浜1-1-27",
    parking: "提携駐車場あり",
    wifi: "あり",
    nonSmoking: "禁煙席あり",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "中之島 Library Cafe",
    description: "本棚に囲まれた静かな空間。リモートワークにも◎。",
    address: "大阪市北区中之島4-3-1",
    parking: "なし",
    wifi: "高速Wi-Fi",
    nonSmoking: "全面禁煙",
    image: "https://images.unsplash.com/photo-1484980972926-edee96e0960d?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Tranquil 南船場",
    description: "アンティーク家具に囲まれた夜カフェ。フードも自家製。",
    address: "大阪市中央区南船場3-6-22",
    parking: "バイク専用Pあり",
    wifi: "あり",
    nonSmoking: "禁煙席あり",
    image: "https://images.unsplash.com/photo-1496817551164-9f140b3c8d45?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "堀江クラフトラウンジ",
    description: "植物と光のバランスが心地よい。ビーカー仕立てのドリンクが特徴。",
    address: "大阪市西区南堀江1-16-9",
    parking: "なし",
    wifi: "あり",
    nonSmoking: "全面禁煙",
    image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "古民家カフェ 舞子",
    description: "白壁と土間、和の雰囲気を取り入れた大阪らしい時間。",
    address: "大阪市西区京町堀2-5-14",
    parking: "近隣月極P",
    wifi: "なし",
    nonSmoking: "禁煙席あり",
    image: "https://images.unsplash.com/photo-1495462916293-7d0b2f0a2f33?auto=format&fit=crop&w=900&q=80",
  },
];

const pages = [1, 2, 3, 4];

export default function Home() {
  return (
    <div className="min-h-screen text-coffee-900">
      <Header />

      <main className="space-y-6 pb-16">
        <FilterPanel midAreas={midAreas} smallAreas={smallAreas} />
        <CafeGrid cafes={cafeCards} pages={pages} summary={42} />
      </main>
    </div>
  );
}
