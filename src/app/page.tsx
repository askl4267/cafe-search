const midAreas = [
  { name: "梅田・堂島", count: 18, selected: true },
  { name: "谷町・天満橋", count: 14, selected: false },
  { name: "中之島", count: 12, selected: false },
  { name: "南船場・心斎橋", count: 20, selected: false },
  { name: "堀江・西長堀", count: 9, selected: false },
];

const smallAreas = [
  { name: "中崎町", count: 7, checked: true },
  { name: "中之島公園", count: 4, checked: false },
  { name: "堀江公園", count: 5, checked: false },
  { name: "北浜", count: 6, checked: false },
  { name: "南船場", count: 3, checked: false },
  { name: "御堂筋本町", count: 5, checked: false },
];

const cafeCards = [
  {
    name: "Cafe & Roastery 初雪",
    description:
      "焙煎所併設のカフェ。木のカウンター越しにシングルオリジンを楽しめる。",
    address: "大阪市北区中崎町2-3-12",
    parking: "近隣コインP",
    wifi: "あり",
    nonSmoking: "全面禁煙",
    image:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "北浜フィールドリビング",
    description: "川を望むテラスが自慢。ラテアートからブランチまで。",
    address: "大阪市中央区北浜1-1-27",
    parking: "提携駐車場あり",
    wifi: "あり",
    nonSmoking: "禁煙席あり",
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "中之島 Library Cafe",
    description: "本棚に囲まれた静かな空間。リモートワークにも◎。",
    address: "大阪市北区中之島4-3-1",
    parking: "なし",
    wifi: "高速Wi-Fi",
    nonSmoking: "全面禁煙",
    image:
      "https://images.unsplash.com/photo-1484980972926-edee96e0960d?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Tranquil 南船場",
    description: "アンティーク家具に囲まれた夜カフェ。フードも自家製。",
    address: "大阪市中央区南船場3-6-22",
    parking: "バイク専用Pあり",
    wifi: "あり",
    nonSmoking: "禁煙席あり",
    image:
      "https://images.unsplash.com/photo-1496817551164-9f140b3c8d45?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "堀江クラフトラウンジ",
    description: "植物と光のバランスが心地よい。ビーカー仕立てのドリンクが特徴。",
    address: "大阪市西区南堀江1-16-9",
    parking: "なし",
    wifi: "あり",
    nonSmoking: "全面禁煙",
    image:
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "古民家カフェ 舞子",
    description: "白壁と土間、和の雰囲気を取り入れた大阪らしい時間。",
    address: "大阪市西区京町堀2-5-14",
    parking: "近隣月極P",
    wifi: "なし",
    nonSmoking: "禁煙席あり",
    image:
      "https://images.unsplash.com/photo-1495462916293-7d0b2f0a2f33?auto=format&fit=crop&w=900&q=80",
  },
];

const pages = [1, 2, 3, 4];

export default function Home() {
  return (
    <div className="min-h-screen text-coffee-900">
      <header className="sticky top-0 z-50 bg-cream-100/80 backdrop-blur border-b border-coffee-200">
        <div className="max-w-7xl mx-auto flex items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-coffee-600" />
            <div className="font-display text-2xl tracking-wide">Osaka Cafe Finder</div>
          </div>
          <div className="ml-4 text-sm text-coffee-600 hidden md:block">
            いまのおすすめ 42 件
          </div>
          <div className="ml-auto text-xs text-coffee-500">Powered by Hot Pepper</div>
        </div>
      </header>

      <main className="space-y-6 pb-16">
        <section className="border-b border-coffee-100">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
            <h1 className="font-display text-3xl sm:text-4xl text-coffee-800">
              今日はどんなカフェ気分？
            </h1>
            <p className="text-coffee-700/80 mt-2">
              エリア・駐車・禁煙で絞って、雰囲気の合うお店を見つけよう。
            </p>

            <div className="mt-6 bg-cream-50/70 border border-coffee-200 rounded-2xl shadow-card p-4 sm:p-6">
              <section className="bg-cream-100/60 border border-cream-200 rounded-2xl p-4">
                <h3 className="text-coffee-800 font-semibold mb-2">エリア</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {midAreas.map((area) => (
                    <button
                      key={area.name}
                      type="button"
                      className={`px-3 py-1.5 rounded-full border text-sm transition ${
                        area.selected
                          ? "bg-coffee-700 text-white border-coffee-700"
                          : "border-coffee-200 text-coffee-800 hover:bg-cream-200/60"
                      }`}
                    >
                      {area.count ? `${area.name}（${area.count}）` : area.name}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="text-sm text-coffee-700 font-semibold">小エリア</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {smallAreas.map((area) => (
                      <label
                        className="flex items-center gap-2 rounded-xl border border-cream-300 bg-white px-3 py-2"
                        key={area.name}
                      >
                        <input type="checkbox" defaultChecked={area.checked} className="rounded" />
                        <span className="text-sm text-coffee-800">
                          {area.name}
                          {area.count ? `（${area.count}）` : ""}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <label className="block">
                    <span className="text-sm text-coffee-700">駐車</span>
                    <select className="w-full rounded-xl border border-cream-300 bg-white p-2">
                      <option value="any">指定なし</option>
                      <option value="has">あり</option>
                      <option value="none">なし</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm text-coffee-700">禁煙</span>
                    <select className="w-full rounded-xl border border-cream-300 bg-white p-2">
                      <option value="any">指定なし</option>
                      <option value="non_smoking">全面禁煙</option>
                      <option value="has_non_smoking">禁煙席あり</option>
                    </select>
                  </label>
                  <div className="flex items-end">
                    <button className="w-full bg-coffee-600 hover:bg-coffee-700 text-white rounded-xl py-2">
                      検索する
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 mt-6 space-y-4">
          <p className="text-sm text-coffee-700/80">該当: 42 件</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="cards">
            {cafeCards.map((cafe) => (
              <article
                key={cafe.name}
                className="bg-cream-100 rounded-2xl shadow-card overflow-hidden flex flex-col h-full"
              >
                <div
                  className="w-full aspect-4-3 bg-cover bg-center"
                  style={{ backgroundImage: `url(${cafe.image})` }}
                  role="presentation"
                />
                <div className="p-4 flex flex-col gap-2 grow">
                  <h3 className="font-semibold text-coffee-800 line-clamp-2 min-h-[2.5rem]">
                    {cafe.name}
                  </h3>
                  <p className="text-sm text-coffee-700 line-clamp-2 min-h-[2.5rem]">
                    {cafe.address}
                  </p>
                  <p className="text-xs text-coffee-600">
                    禁煙: {cafe.nonSmoking} ／ Wi-Fi: {cafe.wifi} ／ 駐車: {cafe.parking}
                  </p>
                  <p className="text-sm text-coffee-600">{cafe.description}</p>
                  <div className="mt-auto pt-2">
                    <a
                      href="https://www.hotpepper.jp/"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-white bg-coffee-600 hover:bg-coffee-700 px-3 py-1.5 rounded-lg"
                    >
                      HotPepperで見る
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <nav
            className="mt-6 flex items-center justify-center gap-2"
            aria-label="ページネーション"
          >
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
                  page === 1
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
          <div className="w-full text-center text-sm text-coffee-600 mt-2">1 / 4ページ</div>
        </section>
      </main>
    </div>
  );
}
