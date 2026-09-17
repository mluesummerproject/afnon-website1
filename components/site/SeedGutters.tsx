/**
 * Ambient anor seeds drifting down the page's side margins — background
 * texture, in the brand's own seed: the same shape the opening sequence
 * scatters, fly-to-basket throws and the scroll seed carries.
 *
 * What keeps them reading as seeds in air rather than rain: every seed rests
 * at its own angle and tumbles slowly, sways sideways on its own rhythm, and
 * sizes, depths and speeds vary widely — a few large, faint, slow seeds behind
 * smaller, darker, livelier ones.
 *
 * Deliberately a Server Component with no JavaScript at all: markup plus CSS
 * keyframes on transform and opacity, so it costs nothing on the main thread
 * and cannot jank the menu while it scrolls. The gutters are pointer-events:
 * none, overflow: hidden, narrower than the real side margin and kept clear of
 * the content column — and zero-width on a phone, which has no margin to fill.
 *
 * Randomness is hashed from each seed's index rather than drawn from
 * Math.random(), so the server and the browser agree on every value and the
 * scatter still reads as unplanned.
 */

const PER_SIDE = 18;

/** The brand seed (see BasketProvider's flight, IntroOverlay, ScrollSeed). */
const SEED_PATH = 'M5 0C7 3.5 9 6.5 9 9a4 4 0 0 1-8 0C1 6.5 3 3.5 5 0Z';

/** Deterministic 0..1 from two small integers — cheap, stable, good enough to look unplanned. */
function noise(index: number, salt: number): number {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function Seed({ index, side }: { index: number; side: 0 | 1 }) {
  const salt = side * 97 + 13;
  const n = (k: number) => noise(index, salt + k);

  // Depth drives the rest: near seeds are small, dark and quicker; far ones large, faint and slow.
  const depth = n(1) ** 1.6; // skewed toward near
  const size = 5 + depth * 11 + n(2) * 3; // ~5–19px
  const opacity = 0.41 - depth * 0.27 + (n(3) - 0.5) * 0.06; // ~0.12–0.44: texture, never objects
  const duration = 38 + depth * 70 + n(4) * 30; // 38–138s to cross the screen
  const swayDuration = 6 + n(5) * 12; // 6–18s per side-to-side
  const sway = 5 + n(6) * 17; // 5–22px either way

  return (
    <span
      className="seed-fall"
      style={
        {
          '--xr': n(7).toFixed(3),
          '--dur': `${duration.toFixed(1)}s`,
          '--delay': `${(-n(8) * duration).toFixed(1)}s`, // already mid-flight on arrival
          '--op': opacity.toFixed(2),
          '--sway-dur': `${swayDuration.toFixed(1)}s`,
          '--sway-delay': `${(-n(9) * swayDuration).toFixed(1)}s`,
          '--sway': `${sway.toFixed(1)}px`,
          '--angle': `${Math.round(n(10) * 360)}deg`,
          '--spin': `${Math.round((n(11) < 0.5 ? -1 : 1) * (90 + n(12) * 320))}deg`,
          '--size': `${size.toFixed(1)}px`,
        } as React.CSSProperties
      }
    >
      <span className="seed-sway">
        <svg className="seed-spin" viewBox="0 0 10 13" aria-hidden="true" focusable="false">
          <path d={SEED_PATH} fill="currentColor" />
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
