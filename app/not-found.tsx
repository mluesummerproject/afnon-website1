import { Action } from '@/components/ui/Action';
import { AnorMark } from '@/components/ui/AnorMark';
import { brand } from '@/lib/site';

export default function NotFound() {
  return (
    <main className="flex min-h-[100svh] items-center bg-paper">
      <div className="shell">
        <AnorMark className="h-10 w-auto text-anor" />
        <p className="label mt-8 text-ink-muted">404</p>
        <h1 className="mt-5 max-w-measure-wide text-display-xl text-ink">
          This page is not on the menu.
        </h1>
        <p className="mt-6 max-w-measure text-lead text-ink-secondary">
          The link may be out of date. Everything {brand.name} publishes lives on one page.
        </p>
        <Action href="/" variant="outline" withArrow className="mt-9">
          Back to the restaurant
        </Action>
      </div>
    </main>
  );
}
