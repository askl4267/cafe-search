'use client';

type SearchSkeletonProps = {
  count?: number;
};

export default function SearchSkeleton({ count = 3 }: SearchSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-2xl bg-cream-50/80 p-4 shadow-card"
        >
          <div className="h-40 w-full rounded-2xl bg-cream-200 skeleton" />
          <div className="space-y-2">
            <div className="h-6 w-3/4 rounded-xl bg-cream-200 skeleton" />
            <div className="h-4 w-2/3 rounded-xl bg-cream-200 skeleton" />
            <div className="h-3 w-1/2 rounded-xl bg-cream-200 skeleton" />
          </div>
        </div>
      ))}
    </>
  );
}
