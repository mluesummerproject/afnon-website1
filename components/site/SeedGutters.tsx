/**
 * Ambient anor seeds drifting down the page's side margins — background
 * texture, in the brand's own seed shape.
 *
 * Deliberately a Server Component with no JavaScript at all: the whole thing
 * is markup plus two CSS keyframes, so it costs nothing on the main thread
 * and cannot jank the menu while it scrolls. The gutters are pointer-events:
 * none and, through clamp(), are exactly as wide as the real side margin —
 * which is zero on a phone, so they never appear over content.
 *
 * Randomness is hashed from each seed's index rather than drawn from
 * Math.random(), so the server and the browser agree on every value and the
 * scatter still reads as unplanned.
 */

const PER_SIDE = 40;

/** Deterministic 0..1 from two small integers — cheap, stable, good enough to look unplanned. */
function noise(index: number, salt: number): number {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function Seed({ index, side }: { index: number; side: 0 | 1 }) {
  const salt = side * 97;
  const size = 6 + noise(index, salt + 1) * 8; // 6–14px
  const opacity = 0.25 + noise(index, salt + 2) * 0.35; // 0.25–0.6
  const duration = 26 + noise(index, salt + 3) * 34; // 26–60s, so none of them keep time together
  const delay = -noise(index, salt + 4) * duration; // negative: the gutter is already full on arrival
  const swayDuration = 5 + noise(index, salt + 5) * 7; // 5–12s
  const sway = 3 + noise(index, salt + 6) * 7; // 3–10px

  return (
    <span
      className="seed-fall"
      style={
        {
          '--x': `${noise(index, salt + 7) * 78}%`,
          '--dur': `${duration}s`,
          '--delay': `${delay}s`,
          '--op': opacity,
          '--sway-dur': `${swayDuration}s`,
          '--sway': `${sway}px`,
        } as React.CSSProperties
      }
    >
      <span className="seed-sway">
        <svg width={size} height={size * 1.3} viewBox="0 0 10 13" fill="none" aria-hidden="true" focusable="false">
          <path d="M5 0C7 3.5 9 6.5 9 9a4 4 0 0 1-8 0C1 6.5 3 3.5 5 0Z" fill="currentColor" />
        </svg>
      </span>
    </span>
  );
}

export function SeedGutters() {
  return (
    <div aria-hidden="true">
      {([0, 1] as const).map((side) => (
        <div key={side} className={`seed-gutter ${side === 0 ? 'seed-gutter-left' : 'seed-gutter-right'}`}>
          {Array.from({ length: PER_SIDE }, (_, index) => (
            <Seed key={index} index={index} side={side} />
          ))}
        </div>
      ))}
    </div>
  );
}
