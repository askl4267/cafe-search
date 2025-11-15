'use client';

import clsx from 'clsx';

type AreaItem = {
  code: string;
  name: string;
};

type AreaCounts = {
  midMap: Record<string, number>;
  smallMap: Record<string, number>;
};

type Option = {
  value: string;
  label: string;
};

type FilterPanelProps = {
  middleAreas: AreaItem[];
  smallAreas: AreaItem[];
  areaCounts: AreaCounts;
  selectedMids: string[];
  selectedSmalls: string[];
  parking: string;
  smoking: string;
  parkingOptions: Option[];
  smokingOptions: Option[];
  onToggleMid: (code: string) => void;
  onToggleSmall: (code: string) => void;
  onParkingChange: (value: string) => void;
  onSmokingChange: (value: string) => void;
  onSearch: () => void;
  disabled?: boolean;
};

export default function FilterPanel({
  middleAreas,
  smallAreas,
  areaCounts,
  selectedMids,
  selectedSmalls,
  parking,
  smoking,
  parkingOptions,
  smokingOptions,
  onToggleMid,
  onToggleSmall,
  onParkingChange,
  onSmokingChange,
  onSearch,
  disabled,
}: FilterPanelProps) {
  const hasSmall = selectedMids.length > 0;
  const smallCandidates = hasSmall
    ? smallAreas
        .filter((area) => (areaCounts.smallMap[area.code] ?? 0) > 0)
        .sort((a, b) => a.name.localeCompare(b.name, 'ja'))
    : [];

  return (
    <div className="space-y-4">
      <section className="bg-cream-100/60 border border-cream-200 rounded-2xl p-4">
        <h3 className="text-coffee-800 font-semibold mb-2">エリア</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {middleAreas.map((area) => {
            const count = areaCounts.midMap[area.code] ?? 0;
            const active = selectedMids.includes(area.code);
            return (
              <button
                key={area.code}
                type="button"
                disabled={disabled}
                onClick={() => onToggleMid(area.code)}
                className={clsx(
                  'px-3 py-1.5 rounded-full border text-sm transition',
                  active
                    ? 'bg-coffee-700 text-white border-coffee-700'
                    : 'border-coffee-200 text-coffee-800 hover:bg-cream-200/60'
                )}
              >
                {count ? `${area.name}（${count}）` : area.name}
              </button>
            );
          })}
        </div>
        <div className={clsx('space-y-3 transition', hasSmall ? 'block' : 'hidden')}>
          <div className="text-sm text-coffee-700 font-semibold">小エリア</div>
          {hasSmall && smallCandidates.length === 0 ? (
            <p className="text-sm text-coffee-600">選択中の条件に合う小エリアはありません。</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {smallCandidates.map((area) => {
                const count = areaCounts.smallMap[area.code] ?? 0;
                const checked = selectedSmalls.includes(area.code);
                return (
                  <label
                    key={area.code}
                    className={clsx(
                      'flex cursor-pointer items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm transition',
                      checked ? 'border-coffee-700 bg-coffee-50' : 'border-cream-300'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleSmall(area.code)}
                      className="h-4 w-4 rounded"
                    />
                    <span className="text-sm">
                      {count ? `${area.name}（${count}）` : area.name}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
        {!hasSmall && (
          <p className="mt-2 text-xs text-coffee-600">中エリアを選択すると小エリア候補が表示されます。</p>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-sm text-coffee-700">駐車</span>
          <select
            value={parking}
            onChange={(event) => onParkingChange(event.target.value)}
            disabled={disabled}
            className="mt-1 w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm"
          >
            {parkingOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-coffee-700">禁煙</span>
          <select
            value={smoking}
            onChange={(event) => onSmokingChange(event.target.value)}
            disabled={disabled}
            className="mt-1 w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm"
          >
            {smokingOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={onSearch}
            disabled={disabled}
            className="w-full rounded-xl bg-coffee-600 px-4 py-2 text-white transition hover:bg-coffee-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            検索する
          </button>
        </div>
      </div>
    </div>
  );
}
