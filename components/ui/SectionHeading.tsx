import { Reveal } from '@/components/ui/Reveal';

type SectionHeadingProps = {
  index: string;
  kicker: string;
  /** Rendered as the section's h2. */
  heading: string;
  id?: string;
  tone?: 'paper' | 'night' | 'anor';
  className?: string;
};

/**
 * The recurring editorial masthead: a numbered index, a tracked-out kicker and
 * a display heading, hung off a hairline rule. Repeating this exact object is
 * what makes five very different sections read as one publication.
 */
export function SectionHeading({
  index,
  kicker,
  heading,
  id,
  tone = 'paper',
  className = '',
}: SectionHeadingProps) {
  const ruleClass = tone === 'anor' ? 'border-paper/30' : tone === 'night' ? 'border-line-night' : 'border-line-strong';
  const indexClass = tone === 'anor' ? 'text-gold-soft' : tone === 'night' ? 'text-gold-soft' : 'text-anor';
  const kickerClass = tone === 'anor' ? 'text-paper/70' : tone === 'night' ? 'text-on-night-muted' : 'text-ink-muted';
  const headingClass = tone === 'anor' ? 'text-paper' : tone === 'night' ? 'text-on-night' : 'text-ink';

  return (
    <div className={className}>
      <div className={`flex items-baseline gap-4 border-t pt-4 ${ruleClass}`}>
        <span className={`label figures ${indexClass}`}>{index}</span>
        <span className={`label ${kickerClass}`}>{kicker}</span>
      </div>

      <Reveal>
        <h2 id={id} className={`mt-7 max-w-measure-wide text-display-lg ${headingClass}`}>
          {heading}
        </h2>
      </Reveal>
    </div>
  );
}
