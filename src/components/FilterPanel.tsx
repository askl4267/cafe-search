import type { MidArea, SmallArea } from "../app/types";

type Props = {
  midAreas: MidArea[];
  smallAreas: SmallArea[];
};

export default function FilterPanel({ midAreas, smallAreas }: Props) {
  return (
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
  );
}
