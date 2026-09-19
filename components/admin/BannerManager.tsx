'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

import {
  deleteBanner,
  finalizeBannerUpload,
  moveBanner,
  requestBannerUpload,
  setBannerActive,
  updateBannerLink,
  updateBannerTitle,
} from '@/app/admin/media-actions';
import { ActionForm } from '@/components/admin/ActionForm';
import { AdminEmpty } from '@/components/admin/AdminEmpty';
import { useT } from '@/components/admin/AdminLangProvider';
import { Chevron } from '@/components/admin/AdminMenu';
import { SubmitButton } from '@/components/admin/SubmitButton';
import { toast } from '@/components/admin/toast';
import { prepareImage, uploadToSignedUrl } from '@/components/admin/upload';
import { useAdminAction } from '@/components/admin/useAdminAction';
import { useReorderList } from '@/components/admin/useReorderList';
import { format } from '@/lib/i18n';
import { formatBytes, MAX_IMAGE_BYTES } from '@/lib/media';
import type { Banner } from '@/lib/types';

type Upload = { name: string; size: number; stage: 'uploading' | 'checking' | 'failed'; progress: number; error?: string };

/**
 * The promo carousel on the website: wide (16:9) photos, one active set at a
 * time, in this order. Mirrors the Films manager so the two feel familiar.
 */
function BannerLink({ banner, categories }: { banner: Banner; categories: string[] }) {
  const t = useT();
  const [type, setType] = useState<'' | 'category' | 'external'>(banner.link_type ?? '');

  return (
    <ActionForm action={updateBannerLink} className="space-y-2 border-t border-line pt-3">
      <input type="hidden" name="id" value={banner.id} />
      <label htmlFor={`banner-link-type-${banner.id}`} className="block text-body-sm font-medium text-ink">
        {t.banners.linkLabel}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          id={`banner-link-type-${banner.id}`}
          name="link_type"
          value={type}
          onChange={(event) => setType(event.target.value as '' | 'category' | 'external')}
          className="field border-line-strong sm:w-52"
        >
          <option value="">{t.banners.linkNone}</option>
          <option value="category">{t.banners.linkCategory}</option>
          <option value="external">{t.banners.linkExternal}</option>
        </select>

        {type === 'category' ? (
          categories.length > 0 ? (
            <select
              name="link_value"
              defaultValue={banner.link_type === 'category' ? banner.link_value ?? '' : ''}
              aria-label={t.banners.linkCategoryLabel}
              className="field border-line-strong"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          ) : (
            <p className="self-center text-micro text-ink-muted">{t.banners.linkNoCategories}</p>
          )
        ) : null}

        {type === 'external' ? (
          <input
            name="link_value"
            type="url"
            inputMode="url"
            maxLength={500}
            defaultValue={banner.link_type === 'external' ? banner.link_value ?? '' : ''}
            placeholder="https://…"
            aria-label={t.banners.linkExternalLabel}
            className="field border-line-strong"
          />
        ) : null}

        <SubmitButton variant="secondary" pendingLabel={t.banners.saving} savedLabel={t.toast.savedShort} className="shrink-0">
          {t.banners.saveLink}
        </SubmitButton>
      </div>
      <p className="text-micro text-ink-muted">{t.banners.linkHint}</p>
    </ActionForm>
  );
}

export function BannerManager({ banners, categories, linksReady }: { banners: Banner[]; categories: string[]; linksReady: boolean }) {
  const t = useT();
  const uploadMessages = {
    photoFormat: t.toast.photoFormat,
    connectionDropped: t.toast.connectionDropped,
    uploadTimedOut: t.toast.uploadTimedOut,
    uploadFailedStatus: t.toast.uploadFailedStatus,
    uploadFailedReason: t.toast.uploadFailedReason,
  };
  const [title, setTitle] = useState('');
  const [upload, setUpload] = useState<Upload | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [pending, run] = useAdminAction();
  const { list: ordered, move, reset } = useReorderList(banners, (banner) => banner.id);
  const busy = upload !== null && upload.stage !== 'failed';
  const activeCount = banners.filter((banner) => banner.is_active !== false).length;

  const onPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || busy) return;

    setUpload({ name: file.name, size: file.size, stage: 'uploading', progress: 0 });
    try {
      const blob = await prepareImage(file, uploadMessages);
      const ticket = await requestBannerUpload(blob.type, blob.size);
      if (!ticket.ok) throw new Error(ticket.message);

      await uploadToSignedUrl(
        ticket.url,
        blob,
        ticket.path.split('/').pop() ?? 'banner.jpg',
        (progress) => setUpload((current) => (current ? { ...current, progress } : current)),
        uploadMessages,
      );

      setUpload((current) => (current ? { ...current, stage: 'checking', progress: 1 } : current));
      const result = await finalizeBannerUpload(ticket.path, title);
      if (!result?.ok) throw new Error(result?.message ?? t.banners.saveFailedShort);

      toast({ ok: true, message: result.message });
      setTitle('');
      setUpload(null);
    } catch (error) {
      setUpload((current) =>
        current ? { ...current, stage: 'failed', error: error instanceof Error ? error.message : t.banners.uploadFailed } : current,
      );
    }
  };

  return (
    <div className="mt-6 space-y-10">
      <section aria-labelledby="add-banner" className="border-l-2 border-anor bg-surface p-4 md:p-6">
        <h2 id="add-banner" className="font-display text-display-sm text-ink">{t.banners.addHeading}</h2>
        <p className="mt-1 text-body-sm text-ink-secondary">{t.banners.addHint}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label htmlFor="banner-title" className="text-body-sm font-medium text-ink">
              {t.banners.bannerTitle} <span className="label text-ink-muted">{t.banners.titleOptional}</span>
            </label>
            <input
              id="banner-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              disabled={busy}
              placeholder={t.banners.titlePlaceholder}
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
            {busy ? t.banners.uploading : t.banners.choosePhoto}
            <input type="file" accept="image/*" onChange={onPick} disabled={busy} className="sr-only" />
          </label>
        </div>

        {upload ? (
          <div className="mt-4 rounded-hair border border-line bg-paper px-3 py-3" aria-live="polite">
            <div className="flex items-center justify-between gap-3 text-micro">
              <span className="min-w-0 truncate text-ink">{upload.name}</span>
              <span className={`shrink-0 font-medium ${upload.stage === 'failed' ? 'text-critical' : 'text-ink-secondary'}`}>
                {upload.stage === 'uploading' ? `${t.banners.uploading.replace('…', '')} ${Math.round(upload.progress * 100)}%` : upload.stage === 'checking' ? t.banners.checking : t.banners.failed}
                {' · '}
                {formatBytes(upload.size)}
              </span>
            </div>
            {upload.stage === 'failed' ? (
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-micro text-critical">{upload.error}</p>
                <button type="button" onClick={() => setUpload(null)} className="min-h-[2.75rem] shrink-0 px-3 text-label font-medium uppercase text-anor">
                  {t.banners.dismiss}
                </button>
              </div>
            ) : (
              <div className="mt-2 h-1 overflow-hidden rounded-pill bg-line">
                <div className="h-full origin-left bg-anor transition-transform duration-200" style={{ transform: `scaleX(${upload.progress})` }} />
              </div>
            )}
          </div>
        ) : null}

        <p className="mt-3 text-micro text-ink-muted">{format(t.banners.formats, { size: formatBytes(MAX_IMAGE_BYTES) })}</p>
      </section>

      <section aria-labelledby="banner-list">
        <div className="flex items-baseline justify-between gap-3 border-b border-line-strong pb-3">
          <h2 id="banner-list" className="font-display text-display-sm text-ink">{t.banners.listHeading}</h2>
          <p className="label figures text-ink-muted">{format(t.banners.showingCount, { count: activeCount })}</p>
        </div>

        {banners.length === 0 ? (
          <AdminEmpty>{t.banners.empty}</AdminEmpty>
        ) : (
          <ul>
            {ordered.map((banner, index) => {
              const active = banner.is_active !== false;
              return (
                <motion.li key={banner.id} layout="position" transition={{ type: 'spring', stiffness: 420, damping: 38 }} className="-mx-3 flex flex-col gap-4 rounded-hair border-b border-line px-3 py-5 transition-colors duration-quick hover:bg-surface sm:flex-row">
                  <div className="flex gap-4 sm:contents">
                    <span className="figures label w-5 shrink-0 pt-1 text-ink-muted">{index + 1}</span>
                    <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-hair bg-paper-alt sm:w-40">
                      <Image
                        src={banner.image_url}
                        alt={banner.title ?? ''}
                        fill
                        sizes="10rem"
                        className="object-cover"
                        unoptimized={!/supabase\.co|unsplash\.com/.test(banner.image_url)}
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-3">
                      <span className={`label inline-flex rounded-hair px-2 py-1 ${active ? 'bg-positive/15 text-positive' : 'bg-paper-alt text-ink-muted'}`}>
                        {active ? t.banners.showing : t.banners.hidden}
                      </span>
                      <ActionForm action={updateBannerTitle} className="flex flex-col gap-2 sm:flex-row">
                        <input type="hidden" name="id" value={banner.id} />
                        <label className="sr-only" htmlFor={`banner-title-${banner.id}`}>
                          {t.banners.bannerTitle}
                        </label>
                        <input
                          id={`banner-title-${banner.id}`}
                          name="title"
                          defaultValue={banner.title ?? ''}
                          maxLength={120}
                          placeholder={t.banners.noTitle}
                          className="field border-line-strong"
                        />
                        <SubmitButton variant="secondary" pendingLabel={t.banners.saving} savedLabel={t.toast.savedShort} className="shrink-0">
                          {t.banners.saveTitle}
                        </SubmitButton>
                      </ActionForm>

                      {linksReady ? <BannerLink banner={banner} categories={categories} /> : null}
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
                      {active ? t.banners.hide : t.banners.show}
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={pending || index === 0}
                        onClick={() => {
                          move(banner.id, 'up');
                          void run(() => moveBanner(banner.id, 'up')).then((result) => (result?.ok ? undefined : reset()));
                        }}
                        aria-label={t.banners.moveUp}
                        className="flex h-11 w-11 items-center justify-center rounded-hair border border-line bg-surface text-ink-secondary disabled:opacity-30"
                      >
                        <Chevron direction="up" />
                      </button>
                      <button
                        type="button"
                        disabled={pending || index === ordered.length - 1}
                        onClick={() => {
                          move(banner.id, 'down');
                          void run(() => moveBanner(banner.id, 'down')).then((result) => (result?.ok ? undefined : reset()));
                        }}
                        aria-label={t.banners.moveDown}
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
                          {pending ? t.banners.removing : t.banners.removeYes}
                        </button>
                        <button type="button" onClick={() => setConfirmId(null)} className="min-h-[2.75rem] text-label-lg font-medium uppercase text-ink-secondary">
                          {t.banners.keep}
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setConfirmId(banner.id)} className="min-h-[2.75rem] px-2 text-label-lg font-medium uppercase text-critical">
                        {t.banners.remove}
                      </button>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
