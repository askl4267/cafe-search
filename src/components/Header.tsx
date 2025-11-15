export default function Header() {
  return (
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
  );
}
