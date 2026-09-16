'use client';

import { useState } from 'react';

import { deleteVideo, finalizeVideoUpload, moveVideo, requestVideoUpload, setVideoActive, updateVideoTitle } from '@/app/admin/media-actions';
import { ActionForm } from '@/components/admin/ActionForm';
import { Chevron } from '@/components/admin/AdminMenu';
import { SubmitButton } from '@/components/admin/SubmitButton';
import { toast } from '@/components/admin/toast';
import { uploadToSignedUrl } from '@/components/admin/upload';
import { useAdminAction } from '@/components/admin/useAdminAction';
import { formatBytes, isVideoMime, MAX_VIDEO_BYTES, VIDEO_TYPES } from '@/lib/media';
import type { PromoVideo } from '@/lib/types';

const byExtension: Record<string, keyof typeof VIDEO_TYPES> = { mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' };

function videoMime(file: File): string {
  if (isVideoMime(file.type)) return file.type;
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return byExtension[extension] ?? file.type;
}

type Upload = { name: string; size: number; stage: 'uploading' | 'checking' | 'failed'; progress: number; error?: string };

export function VideoManager({ videos, maxActive }: { videos: PromoVideo[]; maxActive: number }) {
  const [title, setTitle] = useState('');
  const [upload, setUpload] = useState<Upload | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [pending, run] = useAdminAction();
  const busy = upload !== null && upload.stage !== 'failed';
  const activeCount = videos.filter((video) => video.is_active).length;

  const onPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || busy) return;

    const mime = videoMime(file);
    if (!isVideoMime(mime)) {
      toast({ ok: false, message: 'That is not a supported film. Use MP4 (best), WebM or MOV.' });
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast({ ok: false, message: `That film is ${formatBytes(file.size)} — the limit is 50 MB. Trim it or export a smaller file.` });
      return;
    }

    setUpload({ name: file.name, size: file.size, stage: 'uploading', progress: 0 });
    try {
      const ticket = await requestVideoUpload(mime, file.size);
      if (!ticket.ok) throw new Error(ticket.message);

      const blob = file.type === mime ? file : new Blob([file], { type: mime });
      await uploadToSignedUrl(ticket.url, blob, ticket.path.split('/').pop() ?? 'film.mp4', (progress) =>
        setUpload((current) => (current ? { ...current, progress } : current)),
      );

      setUpload((current) => (current ? { ...current, stage: 'checking', progress: 1 } : current));
      const result = await finalizeVideoUpload(ticket.path, title);
      if (!result?.ok) throw new Error(result?.message ?? 'The film could not be saved.');

      toast({ ok: true, message: result.message });
      if (mime === 'video/quicktime') {
        toast({ ok: true, message: 'Tip: MOV films from iPhones may not play on every phone. If it does not play on the website, export it as MP4.' });
      }
      setTitle('');
      setUpload(null);
    } catch (error) {
      setUpload((current) =>
        current ? { ...current, stage: 'failed', error: error instanceof Error ? error.message : 'Upload failed.' } : current,
      );
    }
  };

  return (
    <div className="mt-6 space-y-10">
      <section aria-labelledby="add-film" className="border-l-2 border-anor bg-surface p-4 md:p-6">
        <h2 id="add-film" className="font-display text-display-sm text-ink">Add a film</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label htmlFor="film-title" className="text-body-sm font-medium text-ink">
              Title <span className="label text-ink-muted">optional</span>
            </label>
            <input
              id="film-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              disabled={busy}
              placeholder="e.g. Morning in the kitchen"
              className="field mt-2 border-line-strong"
            />
          </div>
          <label
            className={`flex min-h-[3.5rem] cursor-pointer items-center justify-center gap-3 rounded-hair px-6 text-label-lg font-medium uppercase transition-colors ${
              busy ? 'cursor-wait bg-line text-ink-muted' : 'bg-anor text-paper hover:bg-anor-hover'
            }`}
          >
            <svg aria-hidden="true" width="20" height="14" viewBox="0 0 20 14" fill="none" stroke="currentColor" strokeWidth="1.4">
              <rect x="1" y="1" width="13" height="12" />
              <path d="M14 5L19 2V12L14 9" />
            </svg>
            {busy ? 'Uploading…' : 'Choose film'}
            <input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.mov,.webm,.m4v" onChange={onPick} disabled={busy} className="sr-only" />
          </label>
        </div>

        {upload ? (
          <div className="mt-4 rounded-hair border border-line bg-paper px-3 py-3" aria-live="polite">
            <div className="flex items-center justify-between gap-3 text-micro">
              <span className="min-w-0 truncate text-ink">{upload.name}</span>
              <span className={`shrink-0 font-medium ${upload.stage === 'failed' ? 'text-critical' : 'text-ink-secondary'}`}>
                {upload.stage === 'uploading' ? `Uploading ${Math.round(upload.progress * 100)}%` : upload.stage === 'checking' ? 'Checking' : 'Failed'}
                {' · '}
                {formatBytes(upload.size)}
              </span>
            </div>
            {upload.stage === 'failed' ? (
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-micro text-critical">{upload.error}</p>
                <button type="button" onClick={() => setUpload(null)} className="min-h-[2.75rem] shrink-0 px-3 text-label font-medium uppercase text-anor">
                  Dismiss
                </button>
              </div>
            ) : (
              <div className="mt-2 h-1 overflow-hidden rounded-pill bg-line">
                <div className="h-full origin-left bg-anor transition-transform duration-200" style={{ transform: `scaleX(${upload.progress})` }} />
              </div>
            )}
            {upload.stage === 'uploading' ? <p className="mt-2 text-micro text-ink-muted">Keep this screen open until it finishes.</p> : null}
          </div>
        ) : null}
      </section>

      <section aria-labelledby="film-list">
        <div className="flex items-baseline justify-between gap-3 border-b border-line-strong pb-3">
          <h2 id="film-list" className="font-display text-display-sm text-ink">All films</h2>
          <p className="label figures text-ink-muted">
            {activeCount} of {maxActive} showing
          </p>
        </div>

        {videos.length === 0 ? (
          <p className="mt-6 text-body-sm text-ink-secondary">No films yet. The films section stays hidden on the website until one is added.</p>
        ) : (
          <ul>
            {videos.map((video, index) => {
              const active = video.is_active !== false;
              return (
                <li key={video.id} className="flex flex-col gap-4 border-b border-line py-5 sm:flex-row">
                  <div className="flex gap-4 sm:contents">
                    <span className="figures label w-5 shrink-0 pt-1 text-ink-muted">{index + 1}</span>
                    <video
                      src={`${video.video_url}#t=0.1`}
                      preload="metadata"
                      muted
                      playsInline
                      controls
                      className="aspect-[4/5] w-28 shrink-0 rounded-hair bg-night object-cover sm:w-32"
                    />
                    <div className="min-w-0 flex-1 space-y-3">
                      <span
                        className={`label inline-flex rounded-hair px-2 py-1 ${active ? 'bg-positive/15 text-positive' : 'bg-paper-alt text-ink-muted'}`}
                      >
                        {active ? 'Showing on website' : 'Hidden'}
                      </span>
                      <ActionForm action={updateVideoTitle} className="flex flex-col gap-2 sm:flex-row">
                        <input type="hidden" name="id" value={video.id} />
                        <label className="sr-only" htmlFor={`title-${video.id}`}>
                          Title
                        </label>
                        <input
                          id={`title-${video.id}`}
                          name="title"
                          defaultValue={video.title ?? ''}
                          maxLength={120}
                          placeholder="No title"
                          className="field border-line-strong"
                        />
                        <SubmitButton variant="secondary" pendingLabel="Saving…" className="shrink-0">
                          Save title
                        </SubmitButton>
                      </ActionForm>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-start gap-2 sm:w-44 sm:flex-col sm:items-stretch">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => void run(() => setVideoActive(video.id, !active))}
                      className={`min-h-[2.75rem] flex-1 rounded-hair border px-4 text-label-lg font-medium uppercase disabled:opacity-50 ${
                        active ? 'border-line-strong bg-surface text-ink' : 'border-anor bg-anor text-paper'
                      }`}
                    >
                      {active ? 'Hide' : 'Show'}
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={pending || index === 0}
                        onClick={() => void run(() => moveVideo(video.id, 'up'))}
                        aria-label="Move film up"
                        className="flex h-11 w-11 items-center justify-center rounded-hair border border-line bg-surface text-ink-secondary disabled:opacity-30"
                      >
                        <Chevron direction="up" />
                      </button>
                      <button
                        type="button"
                        disabled={pending || index === videos.length - 1}
                        onClick={() => void run(() => moveVideo(video.id, 'down'))}
                        aria-label="Move film down"
                        className="flex h-11 w-11 items-center justify-center rounded-hair border border-line bg-surface text-ink-secondary disabled:opacity-30"
                      >
                        <Chevron direction="down" />
                      </button>
                    </div>
                    {confirmId === video.id ? (
                      <div className="flex w-full flex-col gap-2">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => void run(() => deleteVideo(video.id)).then(() => setConfirmId(null))}
                          className="min-h-[2.75rem] rounded-hair bg-critical px-4 text-label-lg font-medium uppercase text-paper disabled:opacity-50"
                        >
                          {pending ? 'Removing…' : 'Yes, remove'}
                        </button>
                        <button type="button" onClick={() => setConfirmId(null)} className="min-h-[2.75rem] text-label-lg font-medium uppercase text-ink-secondary">
                          Keep
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setConfirmId(video.id)} className="min-h-[2.75rem] px-2 text-label-lg font-medium uppercase text-critical">
                        Remove…
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
