import Link from 'next/link';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type Variant =
  | 'solid'
  | 'solid-paper'
  | 'outline'
  | 'outline-night'
  | 'outline-paper'
  | 'quiet'
  | 'quiet-night'
  | 'quiet-paper';

const base =
  'group inline-flex items-center justify-center gap-3 rounded-hair px-7 py-4 text-label-lg font-medium uppercase transition-colors duration-base ease-brand';

const variants: Record<Variant, string> = {
  solid: 'bg-anor text-paper hover:bg-anor-deep',
  'solid-paper': 'bg-paper text-anor hover:bg-gold-soft hover:text-night',
  outline: 'border border-line-strong text-ink hover:border-ink hover:bg-ink hover:text-paper',
  'outline-night':
    'border border-line-night text-on-night hover:border-gold-soft hover:text-gold-soft',
  'outline-paper': 'border border-paper/40 text-paper hover:border-paper hover:bg-paper hover:text-anor',
  quiet: 'px-0 py-2 text-ink hover:text-anor',
  'quiet-night': 'px-0 py-2 text-on-night hover:text-gold-soft',
  'quiet-paper': 'px-0 py-2 text-paper hover:text-gold-soft',
};

type ActionProps = {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  /** Renders the trailing rule-and-arrow used on link-style actions. */
  withArrow?: boolean;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className' | 'children'>;

/**
 * The site has exactly one button object, in four tones. No pills, no shadows.
 */
export function Action({
  href,
  children,
  variant = 'solid',
  className = '',
  withArrow = false,
  ...rest
}: ActionProps) {
  const isExternal = /^(https?:|mailto:|tel:)/.test(href);
  const content = (
    <>
      <span>{children}</span>
      {withArrow ? <Arrow /> : null}
    </>
  );

  const classes = `${base} ${variants[variant]} ${className}`;

  if (isExternal) {
    return (
      <a
        href={href}
        className={classes}
        {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
        {...rest}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {content}
    </Link>
  );
}

/** A rule that extends on hover — the site's one piece of interaction candy. */
export function Arrow() {
  return (
    <span aria-hidden="true" className="flex items-center">
      <span className="block h-px w-5 bg-current transition-[width] duration-base ease-brand group-hover:w-8" />
      <svg width="7" height="8" viewBox="0 0 7 8" fill="none" className="-ml-px">
        <path d="M0.5 0.5L6 4L0.5 7.5" stroke="currentColor" strokeWidth="1" />
      </svg>
    </span>
  );
}
