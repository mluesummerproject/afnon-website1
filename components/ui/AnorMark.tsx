type AnorMarkProps = {
  className?: string;
  /** Outer arch only — for use at watermark scale, where the full mark reads as clutter. */
  outline?: boolean;
  /** The seed gives one soft pulse roughly every 20s — reserved for the header, where the mark is always on screen. */
  pulse?: boolean;
};

/**
 * The house mark. A pointed arch — the pomegranate's silhouette abstracted, and
 * the same geometry that runs through Central Asian architecture — with a
 * single seed at its centre. It is the only ornament the site owns, and it is
 * never drawn as a literal fruit.
 */
export function AnorMark({ className = '', outline = false, pulse = false }: AnorMarkProps) {
  return (
    <svg
      viewBox="0 0 24 28"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        d="M1.5 27V12.4C1.5 6.6 6 1.9 12 0.8c6 1.1 10.5 5.8 10.5 11.6V27"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      {outline ? null : (
        <>
          <path
            d="M6.5 27V13.1c0-3.4 2.4-6.2 5.5-6.9 3.1.7 5.5 3.5 5.5 6.9V27"
            stroke="currentColor"
            strokeWidth="1.1"
            opacity="0.45"
          />
          <circle
            cx="12"
            cy="15.4"
            r="1.6"
            fill="currentColor"
            className={pulse ? 'seed-pulse' : undefined}
            {...(pulse ? { 'data-intro-target': 'mark' } : {})}
          />
        </>
      )}
    </svg>
  );
}
