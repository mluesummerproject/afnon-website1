import { FilmReel } from '@/components/site/FilmReel';
import { SectionHeading } from '@/components/site/SectionHeading';
import { clean, format, type Dictionary } from '@/lib/i18n';
import type { PromoVideo } from '@/lib/types';

/**
 * Only rendered when at least one film is active — and when it is not
 * rendered, the nav does not offer a link to it either.
 */
export function Films({ dict, videos }: { dict: Dictionary; videos: PromoVideo[] }) {
  const films = videos.map((video, position) => ({
    id: video.id,
    url: video.video_url,
    title: clean(video.title) ?? format(dict.films.fallbackTitle, { index: position + 1 }),
  }));

  return (
    <section id="films" aria-labelledby="films-heading" className="shell scroll-mt-16 pt-10">
      <SectionHeading id="films-heading">{dict.films.heading}</SectionHeading>
      <FilmReel films={films} labels={dict.films} />
    </section>
  );
}
