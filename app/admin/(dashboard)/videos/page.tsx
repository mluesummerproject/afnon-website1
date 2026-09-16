import type { Metadata } from 'next';

import { VideoManager } from '@/components/admin/VideoManager';
import { getAdminVideos } from '@/lib/admin-data';
import { getAdminDict } from '@/lib/admin-locale';
import { formatBytes, MAX_ACTIVE_VIDEOS, MAX_VIDEO_BYTES } from '@/lib/media';
import { format } from '@/lib/i18n';

export const metadata: Metadata = { title: 'Films' };

export default async function AdminVideosPage() {
  const { videos, error } = await getAdminVideos();
  const t = getAdminDict();

  return (
    <main className="shell py-6 md:py-10">
      <h1 className="font-display text-display-md text-ink">{t.films.title}</h1>
      <p className="mt-1 max-w-measure-wide text-body-sm text-ink-secondary">
        {format(t.films.subtitle, { max: MAX_ACTIVE_VIDEOS, size: formatBytes(MAX_VIDEO_BYTES) })}
      </p>

      {error ? (
        <p role="alert" className="mt-6 border-l-2 border-critical bg-surface px-4 py-3 text-body-sm text-critical">
          {error}
        </p>
      ) : null}

      <VideoManager videos={videos} maxActive={MAX_ACTIVE_VIDEOS} />
    </main>
  );
}
