import type { Metadata } from 'next';

import { VideoManager } from '@/components/admin/VideoManager';
import { getAdminVideos } from '@/lib/admin-data';
import { MAX_ACTIVE_VIDEOS } from '@/lib/media';

export const metadata: Metadata = { title: 'Films' };

export default async function AdminVideosPage() {
  const { videos, error } = await getAdminVideos();

  return (
    <main className="shell py-6 md:py-10">
      <h1 className="font-display text-display-md text-ink">Films</h1>
      <p className="mt-1 max-w-measure-wide text-body-sm text-ink-secondary">
        Up to {MAX_ACTIVE_VIDEOS} films show on the website, in this order. Short clips work best — under a minute, MP4, 50 MB at most.
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
