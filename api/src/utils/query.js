/**
 * クエリパラメータからカンマ区切りの配列を安全に取り出す。
 * 空文字や undefined を吸収し、空要素は取り除く。
 */
export function parseListParam(url, key) {
  return (url.searchParams.get(key) ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

/**
 * 整数パラメータをパースし、範囲やフォールバックを適用する。
 * - 数値化できない場合は fallback を返す
 * - min/max が指定されていればクランプする
 */
export function parseBoundedInt(value, { fallback, min, max }) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  const base = Number.isNaN(parsed) ? fallback : parsed;
  const withMin = min != null ? Math.max(min, base) : base;
  return max != null ? Math.min(max, withMin) : withMin;
}

/**
 * クエリパラメータから文字列を取得し、未指定時はフォールバックを返す。
 */
export function parseStringParam(url, key, fallback = "") {
  const value = url.searchParams.get(key);
  return value ?? fallback;
}
