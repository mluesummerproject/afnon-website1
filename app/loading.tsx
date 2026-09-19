import { AnorMark } from '@/components/ui/AnorMark';
import { getLocaleAndDictionary } from '@/lib/locale';
import { brand } from '@/lib/site';

/**
 * Streamed while the menu is read: same geometry as the real page, so nothing
 * jumps — and carrying the house mark and wordmark in the header's own spot,
 * so even a slow first paint is unmistakably Afnon.
 */
export default function Loading() {
  const { dict } = getLocaleAndDictionary();
  return (
    <div aria-busy="true" className="min-h-[100svh]">
      <span role="status" className="sr-only">
        {dict.a11y.loading}
      </span>
      <div className="h-14 border-b border-transparent">
        <div className="shell flex h-full items-center gap-2">
          <AnorMark className="h-6 w-auto text-accent" />
          <span className="font-wordmark text-[26px] leading-none text-ink">{brand.name}</span>
        </div>
      </div>
      <div className="shell pt-3">
        <div className="shimmer h-11 rounded-[12px]" />
        <div className="shimmer mt-6 h-5 w-40 rounded-md" />
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="rounded-[14px] bg-card p-3 shadow-card">
              <div className="shimmer aspect-square rounded-[10px]" />
              <div className="shimmer mt-2.5 h-4 w-4/5 rounded" />
              <div className="shimmer mt-2 h-3 w-full rounded" />
              <div className="mt-3 flex items-center justify-between">
                <div className="shimmer h-5 w-16 rounded" />
                <div className="shimmer h-9 w-11 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
