'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import {
  deleteImage,
  finalizeImageReplace,
  finalizeImageUpload,
  moveImage,
  reorderImages,
  requestImageUpload,
  updateImageCaption,
} from '@/app/admin/media-actions';
import { useT } from '@/components/admin/AdminLangProvider';
import { Chevron } from '@/components/admin/AdminMenu';
import { toast } from '@/components/admin/toast';
import { prepareImage, uploadToSignedUrl } from '@/components/admin/upload';
import { useAdminAction } from '@/components/admin/useAdminAction';
import { DragIcon } from '@/components/ui/icons';
import { format } from '@/lib/i18n';
import { formatBytes } from '@/lib/media';
import type { MenuImage } from '@/lib/types';

type QueueItem = {
  key: string;
  name: string;
  stage: 'waiting' | 'preparing' | 'uploading' | 'checking' | 'done' | 'failed';
  progress: number;
  size?: number;
  error?: string;
  file: File;
};

/**
 * Built for a phone in the kitchen first, a computer second: one large button
 * adds photos, each tile shows its position with an explicit Cover badge on
 * whichever photo currently sorts first, a caption saves itself the moment you
 * tap away, a replace keeps the same slot, and a photo can be reordered either
 * by dragging on a computer or with arrow buttons on a phone.
 */
export function ImageManager({ dishId, dishName, images }: { dishId: number; dishName: string; images: MenuImage[] }) {
  const t = useT();
  const uploadMessages = {
    photoFormat: t.toast.photoFormat,
    connectionDropped: t.toast.connectionDropped,
    uploadTimedOut: t.toast.uploadTimedOut,
    uploadFailedStatus: t.toast.uploadFailedStatus,
    uploadFailedReason: t.toast.uploadFailedReason,
  };
  const stageLabel: Record<QueueItem['stage'], string> = {
    waiting: t.photos.stageWaiting,
    preparing: t.photos.stagePreparing,
    uploading: t.photos.stageUploading,
    checking: t.photos.stageChecking,
    done: t.photos.stageDone,
    failed: t.photos.stageFailed,
  };
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [pending, run] = useAdminAction();
  const [replacingId, setReplacingId] = useState<number | null>(null);
  const [order, setOrder] = useState<number[] | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);

  // Once the server confirms a new order (fresh `images` prop), drop the local override.
  useEffect(() => {
    setOrder(null);
  }, [images]);

  const ordered = order ? (order.map((id) => images.find((image) => image.id === id)).filter((image): image is MenuImage => Boolean(image))) : images;

  const update = (key: string, patch: Partial<QueueItem>) =>
    setQueue((list) => list.map((item) => (item.key === key ? { ...item, ...patch } : item)));

  const processOne = async (item: QueueItem) => {
    try {
      update(item.key, { stage: 'preparing', progress: 0, error: undefined });
      const blob = await prepareImage(item.file, uploadMessages);
      update(item.key, { size: blob.size });

      const ticket = await requestImageUpload(dishId, blob.type, blob.size);
      if (!ticket.ok) throw new Error(ticket.message);

      update(item.key, { stage: 'uploading' });
      await uploadToSignedUrl(
        ticket.url,
        blob,
        ticket.path.split('/').pop() ?? 'photo.jpg',
        (fraction) => update(item.key, { progress: fraction }),
        uploadMessages,
      );

      update(item.key, { stage: 'checking', progress: 1 });
      const result = await finalizeImageUpload(dishId, ticket.path);
      if (!result?.ok) throw new Error(result?.message ?? t.photos.couldNotSave);

      update(item.key, { stage: 'done' });
      return true;
    } catch (error) {
      update(item.key, { stage: 'failed', error: error instanceof Error ? error.message : t.photos.uploadFailed });
      return false;
    }
  };

  const processQueue = async (items: QueueItem[]) => {
    setBusy(true);
    let added = 0;
    // One at a time: kinder to mobile data, and photos keep the order they were picked in.
    for (const item of items) {
      if (await processOne(item)) added += 1;
    }
    setBusy(false);
    if (added > 0) toast({ ok: true, message: format(added === 1 ? t.photos.addedOne : t.photos.addedMany, { count: added, name: dishName }) });
    if (added < items.length) toast({ ok: false, message: t.photos.someFailed });
    window.setTimeout(() => setQueue((list) => list.filter((entry) => entry.stage !== 'done')), 2500);
  };

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0 || busy) return;

    const items: QueueItem[] = files.slice(0, 12).map((file, index) => ({
      key: `${Date.now()}-${index}-${file.name}`,
      name: file.name || format(t.photos.photoOf, { index: index + 1, total: files.length }),
      stage: 'waiting',
      progress: 0,
      file,
    }));
    if (files.length > 12) toast({ ok: false, message: format(t.photos.tooMany, { max: 12 }) });
    setQueue((list) => [...list.filter((entry) => entry.stage !== 'done'), ...items]);
    void processQueue(items);
  };

  const retry = (item: QueueItem) => {
    if (busy) return;
    void processQueue([item]);
  };

  const onReplacePick = async (image: MenuImage, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || replacingId !== null) return;

    setReplacingId(image.id);
    try {
      const blob = await prepareImage(file, uploadMessages);
      const ticket = await requestImageUpload(dishId, blob.type, blob.size);
      if (!ticket.ok) throw new Error(ticket.message);
      await uploadToSignedUrl(ticket.url, blob, ticket.path.split('/').pop() ?? 'photo.jpg', () => {}, uploadMessages);
      const result = await finalizeImageReplace(image.id, ticket.path);
      if (!result?.ok) throw new Error(result?.message ?? t.photos.couldNotReplace);
      toast({ ok: true, message: result.message });
    } catch (error) {
      toast({ ok: false, message: error instanceof Error ? error.message : t.photos.couldNotReplace });
    } finally {
      setReplacingId(null);
    }
  };

  const onCaptionBlur = (image: MenuImage) => (event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value.trim() === (image.caption ?? '').trim()) return;
    void run(() => updateImageCaption(image.id, value));
  };

  const dropOn = (targetId: number) => {
    if (dragId === null || dragId === targetId) return;
    setOrder((current) => {
      const base = current ?? images.map((image) => image.id);
      const from = base.indexOf(dragId);
      const to = base.indexOf(targetId);
      if (from < 0 || to < 0) return current;
      const next = [...base];
      next.splice(from, 1);
      next.splice(to, 0, dragId);
      return next;
    });
  };

  const finishDrag = () => {
    const dragged = dragId;
    setDragId(null);
    if (dragged === null || !order) return;
    void run(() => reorderImages(dishId, order));
  };

  return (
    <section aria-labelledby={`photos-${dishId}`} className="border-t border-line pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id={`photos-${dishId}`} className="font-display text-display-sm text-ink">
          {t.photos.heading} <span className="label figures align-middle text-ink-muted">{images.length}</span>
        </h3>
        <p className="max-w-measure text-micro text-ink-muted">{t.photos.bestResults}</p>
      </div>

      <label
        className={`mt-4 flex min-h-[3.5rem] w-full cursor-pointer items-center justify-center gap-3 rounded-hair border-2 border-dashed px-5 text-label-lg font-medium uppercase transition-colors md:w-auto md:justify-start ${
          busy ? 'cursor-wait border-line text-ink-muted' : 'border-anor/40 text-anor hover:border-anor hover:bg-anor-tint'
        }`}
      >
        <svg aria-hidden="true" width="20" height="18" viewBox="0 0 20 18" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M1 5.5H5.5L7 3H13L14.5 5.5H19V17H1Z" />
          <circle cx="10" cy="10.5" r="3.5" />
        </svg>
        {busy ? t.photos.uploading : t.photos.add}
        <input type="file" accept="image/*" multiple onChange={onPick} disabled={busy} className="sr-only" />
      </label>

      {queue.length > 0 ? (
        <ul className="mt-4 space-y-2" aria-live="polite">
          {queue.map((item) => (
            <li key={item.key} className="rounded-hair border border-line bg-paper px-3 py-2.5">
              <div className="flex items-center justify-between gap-3 text-micro">
                <span className="min-w-0 truncate text-ink">{item.name}</span>
                <span className={`shrink-0 font-medium ${item.stage === 'failed' ? 'text-critical' : item.stage === 'done' ? 'text-positive' : 'text-ink-secondary'}`}>
                  {stageLabel[item.stage]}
                  {item.stage === 'uploading' ? ` ${Math.round(item.progress * 100)}%` : ''}
                  {item.size && item.stage !== 'failed' ? ` · ${formatBytes(item.size)}` : ''}
                </span>
              </div>
              {item.stage !== 'failed' ? (
                <div className="mt-2 h-1 overflow-hidden rounded-pill bg-line">
                  <div
                    className="h-full origin-left bg-anor transition-transform duration-200"
                    style={{ transform: `scaleX(${item.stage === 'done' || item.stage === 'checking' ? 1 : item.progress})` }}
                  />
                </div>
              ) : (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-micro text-critical">{item.error}</p>
                  <button type="button" onClick={() => retry(item)} disabled={busy} className="min-h-[2.75rem] shrink-0 px-3 text-label font-medium uppercase text-anor disabled:opacity-40">
                    {t.photos.retry}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {images.length > 0 ? (
        <>
          <p className="mt-5 text-micro text-ink-muted">Drag a tile to reorder on a computer, or use the arrows on a phone.</p>
          <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {ordered.map((image, index) => {
              const isCover = index === 0;
              const replacing = replacingId === image.id;
              return (
                <li
                  key={image.id}
                  draggable
                  onDragStart={(event) => {
                    setDragId(image.id);
                    event.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    dropOn(image.id);
                  }}
                  onDrop={(event) => event.preventDefault()}
                  onDragEnd={finishDrag}
                  className={`overflow-hidden rounded-hair border bg-paper transition-opacity ${dragId === image.id ? 'opacity-50' : 'border-line'}`}
                >
                  <div className="relative aspect-square bg-paper-alt">
                    <Image
                      src={image.image_url}
                      alt={image.caption?.trim() || format(t.photos.photoAlt, { name: dishName, index: index + 1 })}
                      fill
                      sizes="(min-width: 1024px) 14rem, 45vw"
                      className="object-cover"
                      unoptimized={!/supabase\.co|unsplash\.com/.test(image.image_url)}
                    />
                    <span
                      className={`label absolute left-2 top-2 rounded-hair px-1.5 py-1 ${isCover ? 'bg-anor text-paper' : 'bg-ink/80 text-paper'}`}
                    >
                      {isCover ? t.photos.cover : index + 1}
                    </span>
                    <span
                      aria-hidden="true"
                      className="absolute right-2 top-2 hidden h-7 w-7 cursor-grab items-center justify-center rounded-hair bg-ink/60 text-paper sm:flex"
                    >
                      <DragIcon size={15} />
                    </span>
                    {replacing ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-ink/60 text-micro font-medium text-paper">{t.photos.replacing}</div>
                    ) : null}
                  </div>

                  <div className="space-y-2 p-2">
                    <label className="block">
                      <span className="sr-only">{format(t.photos.captionFor, { index: index + 1 })}</span>
                      <input
                        type="text"
                        maxLength={160}
                        defaultValue={image.caption ?? ''}
                        onBlur={onCaptionBlur(image)}
                        placeholder={format(t.photos.captionDefault, { name: dishName })}
                        className="field min-h-[2.5rem] border-line-strong text-micro"
                      />
                    </label>

                    {confirmId === image.id ? (
                      <div className="space-y-1.5">
                        <p className="text-micro text-ink">{t.photos.removeConfirm}</p>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => void run(() => deleteImage(image.id)).then(() => setConfirmId(null))}
                          className="min-h-[2.75rem] w-full rounded-hair bg-critical text-label font-medium uppercase text-paper disabled:opacity-50"
                        >
                          {pending ? t.photos.removing : t.photos.remove}
                        </button>
                        <button type="button" onClick={() => setConfirmId(null)} className="min-h-[2.75rem] w-full text-label font-medium uppercase text-ink-secondary">
                          {t.photos.keep}
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          disabled={pending || index === 0}
                          onClick={() => void run(() => moveImage(image.id, 'up'))}
                          aria-label={format(t.photos.moveEarlier, { index: index + 1 })}
                          className="flex min-h-[2.5rem] items-center justify-center gap-1 rounded-hair border border-line text-ink-secondary hover:text-ink disabled:opacity-30"
                        >
                          <Chevron direction="left" />
                        </button>
                        <button
                          type="button"
                          disabled={pending || index === images.length - 1}
                          onClick={() => void run(() => moveImage(image.id, 'down'))}
                          aria-label={format(t.photos.moveLater, { index: index + 1 })}
                          className="flex min-h-[2.5rem] items-center justify-center gap-1 rounded-hair border border-line text-ink-secondary hover:text-ink disabled:opacity-30"
                        >
                          <Chevron direction="right" />
                        </button>
                        <button
                          type="button"
                          disabled={pending || isCover}
                          onClick={() => void run(() => moveImage(image.id, 'first'))}
                          className="col-span-2 flex min-h-[2.5rem] items-center justify-center rounded-hair border border-line text-label text-ink-secondary hover:text-ink disabled:opacity-30"
                        >
                          {isCover ? t.photos.coverPhoto : t.photos.makeCover}
                        </button>
                        <label
                          className={`col-span-2 flex min-h-[2.5rem] items-center justify-center rounded-hair border border-line text-label uppercase text-ink-secondary hover:text-ink ${
                            replacingId !== null ? 'cursor-wait opacity-40' : 'cursor-pointer'
                          }`}
                        >
                          {t.photos.replacePhoto}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={replacingId !== null}
                            onChange={(event) => void onReplacePick(image, event)}
                            className="sr-only"
                          />
                        </label>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => setConfirmId(image.id)}
                          className="col-span-2 flex min-h-[2.5rem] items-center justify-center gap-1.5 rounded-hair border border-line text-label uppercase text-critical disabled:opacity-30"
                        >
                          <svg aria-hidden="true" width="13" height="14" viewBox="0 0 13 14" fill="none" stroke="currentColor" strokeWidth="1.3">
                            <path d="M1 3.5H12M4.5 3.5V1.5H8.5V3.5M2.5 3.5L3.2 13H9.8L10.5 3.5" />
                          </svg>
                          {t.photos.remove}
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="mt-4 text-body-sm text-ink-muted">{t.photos.noneYet}</p>
      )}
    </section>
  );
}
