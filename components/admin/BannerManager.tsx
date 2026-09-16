'use client';

import Image from 'next/image';
import { useState } from 'react';

import { deleteBanner, finalizeBannerUpload, moveBanner, requestBannerUpload, setBannerActive, updateBannerTitle } from '@/app/admin/media-actions';
import { ActionForm } from '@/components/admin/ActionForm';
import { Chevron } from '@/components/admin/AdminMenu';
import { SubmitButton } from '@/components/admin/SubmitButton';
import { toast } from '@/components/admin/toast';
import { prepareImage, uploadToSignedUrl } from '@/components/admin/upload';
import { useAdminAction } from '@/components/admin/useAdminAction';
import { formatBytes, MAX_IMAGE_BYTES } from '@/lib/media';
import type { Banner } from '@/lib/types';

type Upload = { name: string; size: number; stage: 'uploading' | 'checking' | 'failed'; progress: number; error?: string };

/**
 * The promo carousel on the website: wide (16:9) photos, one active set at a
 * time, in this order. Mirrors the Films manager so the two feel familiar.
 */
export function BannerManager({ banners }: { banners: Banner[] }) {
  const [title, setTitle] = useState('');
  const [upload, setUpload] = useState<Upload | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [pending, run] = useAdminAction();
  const busy = upload !== null && upload.stage !== 'failed';
  const activeCount = banners.filter((banner) => banner.is_active !== false).length;

  const onPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || busy) return;

    setUpload({ name: file.name, size: file.size, stage: 'uploading', progress: 0 });
    try {
      const blob = await prepareImage(file);
      const ticket = await requestBannerUpload(blob.type, blob.size);
      if (!ticket.ok) throw new Error(ticket.message);

      await uploadToSignedUrl(ticket.url, blob, ticket.path.split('/').pop() ?? 'banner.jpg', (progress) =>
        setUpload((current) => (current ? { ...current, progress } : current)),
      );

      setUpload((current) => (current ? { ...current, stage: 'checking', progress: 1 } : current));
      const result = await finalizeBannerUpload(ticket.path, title);
      if (!result?.ok) throw new Error(result?.message ?? 'The banner could not be saved.');

      toast({ ok: true, message: result.message });
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
      <section aria-labelledby="add-banner" className="border-l-2 border-anor bg-surface p-4 md:p-6">
        <h2 id="add-banner" className="font-display text-display-sm text-ink">Add a banner</h2>
        <p className="mt-1 text-body-sm text-ink-secondary">
          Wide photos work best (16:9 — about 1600×900px). It shows on the website the moment it is added.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label htmlFor="banner-title" className="text-body-sm font-medium text-ink">
              Title <span className="label text-ink-muted">optional, not shown to guests</span>
            </label>
            <input
              id="banner-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              disabled={busy}
              placeholder="e.g. Summer menu launch"
              className="field mt-2 border-line-strong"
            />
          </div>
          <label
            className={`flex min-h-[3.5rem] cursor-pointer items-center justify-center gap-3 rounded-hair px-6 text-label-lg font-medium uppercase transition-colors ${
              busy ? 'cursor-wait bg-line text-ink-muted' : 'bg-anor text-paper hover:bg-anor-hover'
            }`}
          >
            <svg aria-hidden="true" width="20" height="18" viewBox="0 0 20 18" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M1 5.5H5.5L7 3H13L14.5 5.5H19V17H1Z" />
              <circle cx="10" cy="10.5" r="3.5" />
            </svg>
            {busy ? 'Uploading…' : 'Choose photo'}
            <input type="file" accept="image/*" onChange={onPick} disabled={busy} className="sr-only" />
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
          </div>
        ) : null}

        <p className="mt-3 text-micro text-ink-muted">JPEG, PNG, WebP or AVIF, up to {formatBytes(MAX_IMAGE_BYTES)}.</p>
      </section>

      <section aria-labelledby="banner-list">
        <div className="flex items-baseline justify-between gap-3 border-b border-line-strong pb-3">
          <h2 id="banner-list" className="font-display text-display-sm text-ink">All banners</h2>
          <p className="label figures text-ink-muted">{activeCount} showing</p>
        </div>

        {banners.length === 0 ? (
          <p className="mt-6 text-body-sm text-ink-secondary">No banners yet. The promo carousel stays hidden on the website until one is added.</p>
        ) : (
          <ul>
            {banners.map((banner, index) => {
              const active = banner.is_active !== false;
              return (
                <li key={banner.id} className="flex flex-col gap-4 border-b border-line py-5 sm:flex-row">
                  <div className="flex gap-4 sm:contents">
                    <span className="figures label w-5 shrink-0 pt-1 text-ink-muted">{index + 1}</span>
                    <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-hair bg-paper-alt sm:w-40">
                      <Image
                        src={banner.image_url}
                        alt={banner.title ?? `Banner ${index + 1}`}
                        fill
                        sizes="10rem"
                        className="object-cover"
                        unoptimized={!/supabase\.co|unsplash\.com/.test(banner.image_url)}
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-3">
                      <span className={`label inline-flex rounded-hair px-2 py-1 ${active ? 'bg-positive/15 text-positive' : 'bg-paper-alt text-ink-muted'}`}>
                        {active ? 'Showing on website' : 'Hidden'}
                      </span>
                      <ActionForm action={updateBannerTitle} className="flex flex-col gap-2 sm:flex-row">
                        <input type="hidden" name="id" value={banner.id} />
                        <label className="sr-only" htmlFor={`banner-title-${banner.id}`}>
                          Title
                        </label>
                        <input
                          id={`banner-title-${banner.id}`}
                          name="title"
                          defaultValue={banner.title ?? ''}
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
                      onClick={() => void run(() => setBannerActive(banner.id, !active))}
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
                        onClick={() => void run(() => moveBanner(banner.id, 'up'))}
                        aria-label="Move banner up"
                        className="flex h-11 w-11 items-center justify-center rounded-hair border border-line bg-surface text-ink-secondary disabled:opacity-30"
                      >
                        <Chevron direction="up" />
                      </button>
                      <button
                        type="button"
                        disabled={pending || index === banners.length - 1}
                        onClick={() => void run(() => moveBanner(banner.id, 'down'))}
                        aria-label="Move banner down"
                        className="flex h-11 w-11 items-center justify-center rounded-hair border border-line bg-surface text-ink-secondary disabled:opacity-30"
                      >
                        <Chevron direction="down" />
                      </button>
                    </div>
                    {confirmId === banner.id ? (
                      <div className="flex w-full flex-col gap-2">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => void run(() => deleteBanner(banner.id)).then(() => setConfirmId(null))}
                          className="min-h-[2.75rem] rounded-hair bg-critical px-4 text-label-lg font-medium uppercase text-paper disabled:opacity-50"
                        >
                          {pending ? 'Removing…' : 'Yes, remove'}
                        </button>
                        <button type="button" onClick={() => setConfirmId(null)} className="min-h-[2.75rem] text-label-lg font-medium uppercase text-ink-secondary">
                          Keep
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setConfirmId(banner.id)} className="min-h-[2.75rem] px-2 text-label-lg font-medium uppercase text-critical">
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
