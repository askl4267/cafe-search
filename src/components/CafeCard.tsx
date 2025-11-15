import type { Cafe } from "../app/types";

type Props = {
  cafe: Cafe;
};

export default function CafeCard({ cafe }: Props) {
  return (
    <article className="bg-cream-100 rounded-2xl shadow-card overflow-hidden flex flex-col h-full">
      <div
        className="w-full aspect-4-3 bg-cover bg-center"
        style={{ backgroundImage: `url(${cafe.image})` }}
        role="presentation"
      />
      <div className="p-4 flex flex-col gap-2 grow">
        <h3 className="font-semibold text-coffee-800 line-clamp-2 min-h-[2.5rem]">{cafe.name}</h3>
        <p className="text-sm text-coffee-700 line-clamp-2 min-h-[2.5rem]">{cafe.address}</p>
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
  );
}
