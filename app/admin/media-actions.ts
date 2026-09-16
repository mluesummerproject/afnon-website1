'use server';

import { randomUUID } from 'node:crypto';

import { fail, readText, refreshSite, requireAdmin, succeed, toId, type ActionResult } from '@/lib/admin';
import {
  IMAGE_TYPES,
  isImageMime,
  isVideoMime,
  MAX_ACTIVE_VIDEOS,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  menuImagePrefix,
  storagePathFromUrl,
  VIDEO_PREFIX,
  VIDEO_TYPES,
} from '@/lib/media';
import { createUploadTarget, inspectObject, objectUrl, removeObjects, sweepOrphans } from '@/lib/storage';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

export type UploadTicket = { ok: true; url: string; path: string } | { ok: false; message: string };

const SAFE_PATH = /^(menu\/\d+|videos|banners)\/[0-9a-f-]{36}\.(jpg|png|webp|avif|mp4|webm|mov)$/;
const BANNER_PREFIX = 'banners/';

/** The file is really in storage, really an image and within limits — or it is deleted. */
async function verifyImageObject(path: string): Promise<string | null> {
  const inspected = await inspectObject(path);
  if (!inspected) return 'The photo did not finish uploading. Please try again.';
  if (!inspected.sniffed || !isImageMime(inspected.sniffed) || inspected.size > MAX_IMAGE_BYTES) {
    await removeObjects([path]);
    return 'That file is not a supported photo, so it was discarded.';
  }
  return null;
}

function renumberWrites(ids: number[]): { id: number; sort_order: number }[] {
  return ids.map((id, index) => ({ id, sort_order: (index + 1) * 10 }));
}

// ================================================================ dish photos

/** Step 1 of 2 — a signed, single-use upload URL for a path the server picks. */
export async function requestImageUpload(menuItemId: unknown, mime: unknown, size: unknown): Promise<UploadTicket> {
  requireAdmin();

  const id = toId(menuItemId);
  if (id === null) return { ok: false, message: 'That dish could not be identified.' };
  if (typeof mime !== 'string' || !isImageMime(mime)) {
    return { ok: false, message: 'Only JPEG, PNG, WebP or AVIF photos can be added.' };
  }
  const bytes = Number(size);
  if (!Number.isFinite(bytes) || bytes <= 0 || bytes > MAX_IMAGE_BYTES) {
    return { ok: false, message: 'That photo is too large (10 MB maximum).' };
  }

  const { data: dish } = await getSupabaseAdmin().from('menu_items').select('id').eq('id', id).maybeSingle();
  if (!dish) return { ok: false, message: 'That dish no longer exists.' };

  try {
    const target = await createUploadTarget(`${menuImagePrefix(id)}${randomUUID()}.${IMAGE_TYPES[mime]}`);
    return { ok: true, ...target };
  } catch {
    return { ok: false, message: 'The upload could not be prepared. Please try again.' };
  }
}

/**
 * Step 2 of 2 — only after the file is really in storage, really an image and
 * within limits does the dish get a database row pointing at it. Anything
 * that fails the check is deleted, so no row ever points at a bad file.
 */
export async function finalizeImageUpload(menuItemId: unknown, path: unknown): Promise<ActionResult & { image?: { id: number; url: string } }> {
  requireAdmin();

  const id = toId(menuItemId);
  if (id === null || typeof path !== 'string' || !SAFE_PATH.test(path) || !path.startsWith(menuImagePrefix(id))) {
    return fail('That upload could not be verified.');
  }

  const problem = await verifyImageObject(path);
  if (problem) return fail(problem);

  const supabase = getSupabaseAdmin();
  const url = objectUrl(path);

  // A retried request must not create a second row for the same file.
  const { data: existing } = await supabase.from('menu_item_images').select('id').eq('image_url', url).maybeSingle();
  if (existing) return { ...succeed('Photo already added.', id), image: { id: existing.id as number, url } };

  const { data: last } = await supabase
    .from('menu_item_images')
    .select('sort_order')
    .eq('menu_item_id', id)
    .order('sort_order', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const { data: row, error } = await supabase
    .from('menu_item_images')
    .insert({ menu_item_id: id, image_url: url, sort_order: ((last?.sort_order as number | null) ?? 0) + 10 })
    .select('id')
    .single();

  if (error || !row) {
    await removeObjects([path]);
    return fail(`The photo could not be saved: ${error?.message ?? 'unknown error'}`);
  }

  refreshSite();
  return { ...succeed('Photo added.', id), image: { id: row.id as number, url } };
}

export async function deleteImage(imageId: unknown): Promise<ActionResult> {
  requireAdmin();

  const id = toId(imageId);
  if (id === null) return fail('That photo could not be identified.');

  const supabase = getSupabaseAdmin();
  const { data: image } = await supabase
    .from('menu_item_images')
    .select('id, menu_item_id, image_url')
    .eq('id', id)
    .maybeSingle();
  if (!image) return fail('That photo was already removed.');

  const { error } = await supabase.from('menu_item_images').delete().eq('id', id);
  if (error) return fail(`Could not remove the photo: ${error.message}`);

  // Only delete the file if it is this dish's own upload — never an external link
  // and never a file that belongs to something else.
  const path = storagePathFromUrl(image.image_url as string, supabaseUrl);
  if (path && image.menu_item_id && path.startsWith(menuImagePrefix(image.menu_item_id as number))) {
    await removeObjects([path]);
  }

  if (image.menu_item_id) {
    const { data: remaining } = await supabase.from('menu_item_images').select('image_url').eq('menu_item_id', image.menu_item_id);
    const referenced = new Set(
      (remaining ?? []).map((row) => storagePathFromUrl(row.image_url as string, supabaseUrl)).filter((p): p is string => Boolean(p)),
    );
    await sweepOrphans(menuImagePrefix(image.menu_item_id as number), referenced);
  }

  refreshSite();
  return succeed('Photo removed.');
}

export async function moveImage(imageId: unknown, direction: unknown): Promise<ActionResult> {
  requireAdmin();

  const id = toId(imageId);
  if (id === null || !['up', 'down', 'first'].includes(direction as string)) return fail('That photo could not be moved.');

  const supabase = getSupabaseAdmin();
  const { data: image } = await supabase.from('menu_item_images').select('menu_item_id').eq('id', id).maybeSingle();
  if (!image?.menu_item_id) return fail('That photo no longer exists.');

  const { data: siblings } = await supabase
    .from('menu_item_images')
    .select('id')
    .eq('menu_item_id', image.menu_item_id)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true });

  const ids = (siblings ?? []).map((row) => row.id as number);
  const index = ids.indexOf(id);
  if (index < 0) return fail('That photo no longer exists.');

  if (direction === 'first') {
    if (index === 0) return succeed('Already the cover photo.');
    ids.splice(index, 1);
    ids.unshift(id);
  } else {
    const target = index + (direction === 'up' ? -1 : 1);
    if (target < 0 || target >= ids.length) return succeed('Nothing to move.');
    [ids[index], ids[target]] = [ids[target], ids[index]];
  }

  const results = await Promise.all(
    renumberWrites(ids).map((write) => supabase.from('menu_item_images').update({ sort_order: write.sort_order }).eq('id', write.id)),
  );
  if (results.some((result) => result.error)) return fail('Could not reorder the photos.');

  refreshSite();
  return succeed(direction === 'first' ? 'Set as the cover photo.' : 'Photo order updated.');
}

// ================================================================ films

export async function requestVideoUpload(mime: unknown, size: unknown): Promise<UploadTicket> {
  requireAdmin();

  if (typeof mime !== 'string' || !isVideoMime(mime)) {
    return { ok: false, message: 'Only MP4, WebM or MOV films can be added. MP4 works best everywhere.' };
  }
  const bytes = Number(size);
  if (!Number.isFinite(bytes) || bytes <= 0 || bytes > MAX_VIDEO_BYTES) {
    return { ok: false, message: 'That film is too large (50 MB maximum). Trim it or export a smaller file.' };
  }

  try {
    const target = await createUploadTarget(`${VIDEO_PREFIX}${randomUUID()}.${VIDEO_TYPES[mime]}`);
    return { ok: true, ...target };
  } catch {
    return { ok: false, message: 'The upload could not be prepared. Please try again.' };
  }
}

export async function finalizeVideoUpload(path: unknown, title: unknown): Promise<ActionResult> {
  requireAdmin();

  if (typeof path !== 'string' || !SAFE_PATH.test(path) || !path.startsWith(VIDEO_PREFIX)) {
    return fail('That upload could not be verified.');
  }

  const inspected = await inspectObject(path);
  if (!inspected) return fail('The film did not finish uploading. Please try again.');

  if (!inspected.sniffed || !isVideoMime(inspected.sniffed) || inspected.size > MAX_VIDEO_BYTES) {
    await removeObjects([path]);
    return fail('That file is not a supported film, so it was discarded.');
  }

  const supabase = getSupabaseAdmin();
  const url = objectUrl(path);

  const { data: existing } = await supabase.from('promo_videos').select('id').eq('video_url', url).maybeSingle();
  if (existing) return succeed('Film already added.', existing.id as number);

  const [{ data: last }, { count: activeCount }] = await Promise.all([
    supabase.from('promo_videos').select('sort_order').order('sort_order', { ascending: false, nullsFirst: false }).limit(1).maybeSingle(),
    supabase.from('promo_videos').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  const cleanTitle = typeof title === 'string' ? title.replace(/\s+/g, ' ').trim().slice(0, 120) : '';
  const makeActive = (activeCount ?? 0) < MAX_ACTIVE_VIDEOS;

  const { data: row, error } = await supabase
    .from('promo_videos')
    .insert({
      video_url: url,
      title: cleanTitle || null,
      is_active: makeActive,
      sort_order: ((last?.sort_order as number | null) ?? 0) + 10,
    })
    .select('id')
    .single();

  if (error || !row) {
    await removeObjects([path]);
    return fail(`The film could not be saved: ${error?.message ?? 'unknown error'}`);
  }

  refreshSite();
  return succeed(
    makeActive
      ? 'Film added and now showing on the website.'
      : `Film added but hidden — ${MAX_ACTIVE_VIDEOS} films are already showing. Hide one to show this.`,
    row.id as number,
  );
}

export async function updateVideoTitle(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  requireAdmin();

  const id = toId(formData.get('id'));
  if (id === null) return fail('That film could not be identified.');
  const title = readText(formData, 'title').replace(/\s+/g, ' ').slice(0, 120);

  const { data, error } = await getSupabaseAdmin()
    .from('promo_videos')
    .update({ title: title || null })
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) return fail(`Could not save the title: ${error.message}`);
  if (!data) return fail('That film no longer exists.');

  refreshSite();
  return succeed('Title saved.', id);
}

export async function setVideoActive(videoId: unknown, active: unknown): Promise<ActionResult> {
  requireAdmin();

  const id = toId(videoId);
  if (id === null) return fail('That film could not be identified.');
  const makeActive = active === true;

  const supabase = getSupabaseAdmin();
  if (makeActive) {
    const { count } = await supabase.from('promo_videos').select('id', { count: 'exact', head: true }).eq('is_active', true).neq('id', id);
    if ((count ?? 0) >= MAX_ACTIVE_VIDEOS) {
      return fail(`${MAX_ACTIVE_VIDEOS} films are already showing. Hide one first.`);
    }
  }

  const { data, error } = await supabase.from('promo_videos').update({ is_active: makeActive }).eq('id', id).select('id').maybeSingle();
  if (error) return fail(`Could not update: ${error.message}`);
  if (!data) return fail('That film no longer exists.');

  refreshSite();
  return succeed(makeActive ? 'Film is now showing on the website.' : 'Film hidden from the website.', id);
}

export async function moveVideo(videoId: unknown, direction: unknown): Promise<ActionResult> {
  requireAdmin();

  const id = toId(videoId);
  if (id === null || (direction !== 'up' && direction !== 'down')) return fail('That film could not be moved.');

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('promo_videos')
    .select('id')
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true });

  const ids = (data ?? []).map((row) => row.id as number);
  const index = ids.indexOf(id);
  const target = index + (direction === 'up' ? -1 : 1);
  if (index < 0) return fail('That film no longer exists.');
  if (target < 0 || target >= ids.length) return succeed('Nothing to move.');
  [ids[index], ids[target]] = [ids[target], ids[index]];

  const results = await Promise.all(
    renumberWrites(ids).map((write) => supabase.from('promo_videos').update({ sort_order: write.sort_order }).eq('id', write.id)),
  );
  if (results.some((result) => result.error)) return fail('Could not reorder the films.');

  refreshSite();
  return succeed('Film order updated.', id);
}

export async function deleteVideo(videoId: unknown): Promise<ActionResult> {
  requireAdmin();

  const id = toId(videoId);
  if (id === null) return fail('That film could not be identified.');

  const supabase = getSupabaseAdmin();
  const { data: video } = await supabase.from('promo_videos').select('id, video_url').eq('id', id).maybeSingle();
  if (!video) return fail('That film was already removed.');

  const { error } = await supabase.from('promo_videos').delete().eq('id', id);
  if (error) return fail(`Could not remove the film: ${error.message}`);

  const path = storagePathFromUrl(video.video_url as string, supabaseUrl);
  if (path && path.startsWith(VIDEO_PREFIX)) await removeObjects([path]);

  const { data: remaining } = await supabase.from('promo_videos').select('video_url');
  const referenced = new Set(
    (remaining ?? []).map((row) => storagePathFromUrl(row.video_url as string, supabaseUrl)).filter((p): p is string => Boolean(p)),
  );
  await sweepOrphans(VIDEO_PREFIX, referenced);

  refreshSite();
  return succeed('Film removed.');
}


// ================================================================ photo details

export async function updateImageCaption(imageId: unknown, caption: unknown): Promise<ActionResult> {
  requireAdmin();
  const id = toId(imageId);
  if (id === null) return fail('That photo could not be identified.');
  const text = typeof caption === 'string' ? caption.replace(/[\x00-\x1f\x7f]/g, ' ').replace(/\s+/g, ' ').trim() : '';
  if (text.length > 160) return fail('Captions can be at most 160 characters.');

  const { data, error } = await getSupabaseAdmin().from('menu_item_images').update({ caption: text || null }).eq('id', id).select('id').maybeSingle();
  if (error) return fail(`Could not save the caption: ${error.message}`);
  if (!data) return fail('That photo no longer exists.');
  refreshSite();
  return succeed(text ? 'Caption saved.' : 'Caption cleared — the dish name is used instead.');
}

/**
 * Drag-and-drop result from the desktop manager: the complete new order for one
 * dish. Accepted only if it is exactly that dish's photos, each once.
 */
export async function reorderImages(menuItemId: unknown, orderedIds: unknown): Promise<ActionResult> {
  requireAdmin();
  const dishId = toId(menuItemId);
  if (dishId === null || !Array.isArray(orderedIds)) return fail('That order could not be saved.');
  const ids = orderedIds.map(toId);
  if (ids.some((id) => id === null)) return fail('That order could not be saved.');

  const supabase = getSupabaseAdmin();
  const { data: current } = await supabase.from('menu_item_images').select('id').eq('menu_item_id', dishId);
  const known = new Set((current ?? []).map((row) => row.id as number));
  if (known.size !== ids.length || new Set(ids).size !== ids.length || ids.some((id) => !known.has(id as number))) {
    return fail('The photos changed while you were arranging them. The page has been refreshed — please try again.');
  }

  const results = await Promise.all(
    renumberWrites(ids as number[]).map((write) => supabase.from('menu_item_images').update({ sort_order: write.sort_order }).eq('id', write.id)),
  );
  if (results.some((result) => result.error)) return fail('Could not save the new photo order.');
  refreshSite();
  return succeed('Photo order saved.');
}

/**
 * Puts a new file into an existing slot: same row, same position, same caption.
 * The old file is removed from storage only after the new one is verified and saved.
 */
export async function finalizeImageReplace(imageId: unknown, path: unknown): Promise<ActionResult> {
  requireAdmin();
  const id = toId(imageId);
  if (id === null || typeof path !== 'string' || !SAFE_PATH.test(path)) return fail('That upload could not be verified.');

  const supabase = getSupabaseAdmin();
  const { data: image } = await supabase.from('menu_item_images').select('id, menu_item_id, image_url').eq('id', id).maybeSingle();
  if (!image?.menu_item_id) {
    await removeObjects([path]);
    return fail('That photo no longer exists.');
  }
  const prefix = menuImagePrefix(image.menu_item_id as number);
  if (!path.startsWith(prefix)) return fail('That upload could not be verified.');

  const problem = await verifyImageObject(path);
  if (problem) return fail(problem);

  const url = objectUrl(path);
  const { error } = await supabase.from('menu_item_images').update({ image_url: url }).eq('id', id);
  if (error) {
    await removeObjects([path]);
    return fail(`The photo could not be replaced: ${error.message}`);
  }

  const oldPath = storagePathFromUrl(image.image_url as string, supabaseUrl);
  if (oldPath && oldPath !== path && oldPath.startsWith(prefix)) await removeObjects([oldPath]);

  refreshSite();
  return succeed('Photo replaced — position and caption kept.');
}

// ================================================================ banners

export async function requestBannerUpload(mime: unknown, size: unknown): Promise<UploadTicket> {
  requireAdmin();
  if (typeof mime !== 'string' || !isImageMime(mime)) return { ok: false, message: 'Only JPEG, PNG, WebP or AVIF images can be used.' };
  const bytes = Number(size);
  if (!Number.isFinite(bytes) || bytes <= 0 || bytes > MAX_IMAGE_BYTES) return { ok: false, message: 'That image is too large (10 MB maximum).' };
  try {
    const target = await createUploadTarget(`${BANNER_PREFIX}${randomUUID()}.${IMAGE_TYPES[mime]}`);
    return { ok: true, ...target };
  } catch {
    return { ok: false, message: 'The upload could not be prepared. Please try again.' };
  }
}

export async function finalizeBannerUpload(path: unknown, title: unknown): Promise<ActionResult> {
  requireAdmin();
  if (typeof path !== 'string' || !SAFE_PATH.test(path) || !path.startsWith(BANNER_PREFIX)) return fail('That upload could not be verified.');

  const problem = await verifyImageObject(path);
  if (problem) return fail(problem);

  const supabase = getSupabaseAdmin();
  const url = objectUrl(path);
  const { data: existing } = await supabase.from('banners').select('id').eq('image_url', url).maybeSingle();
  if (existing) return succeed('Banner already added.', existing.id as number);

  const { data: last } = await supabase.from('banners').select('sort_order').order('sort_order', { ascending: false, nullsFirst: false }).limit(1).maybeSingle();
  const cleanTitle = typeof title === 'string' ? title.replace(/\s+/g, ' ').trim().slice(0, 120) : '';
  const { data: row, error } = await supabase
    .from('banners')
    .insert({ image_url: url, title: cleanTitle || null, is_active: true, sort_order: ((last?.sort_order as number | null) ?? 0) + 10 })
    .select('id')
    .single();
  if (error || !row) {
    await removeObjects([path]);
    return fail(`The banner could not be saved: ${error?.message ?? 'unknown error'}`);
  }
  refreshSite();
  return succeed('Banner added and now showing on the website.', row.id as number);
}

export async function updateBannerTitle(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  requireAdmin();
  const id = toId(formData.get('id'));
  if (id === null) return fail('That banner could not be identified.');
  const title = readText(formData, 'title').replace(/\s+/g, ' ').slice(0, 120);
  const { data, error } = await getSupabaseAdmin().from('banners').update({ title: title || null }).eq('id', id).select('id').maybeSingle();
  if (error) return fail(`Could not save the title: ${error.message}`);
  if (!data) return fail('That banner no longer exists.');
  refreshSite();
  return succeed('Title saved.', id);
}

export async function setBannerActive(bannerId: unknown, active: unknown): Promise<ActionResult> {
  requireAdmin();
  const id = toId(bannerId);
  if (id === null) return fail('That banner could not be identified.');
  const { data, error } = await getSupabaseAdmin().from('banners').update({ is_active: active === true }).eq('id', id).select('id').maybeSingle();
  if (error) return fail(`Could not update: ${error.message}`);
  if (!data) return fail('That banner no longer exists.');
  refreshSite();
  return succeed(active === true ? 'Banner is now showing.' : 'Banner hidden.', id);
}

export async function moveBanner(bannerId: unknown, direction: unknown): Promise<ActionResult> {
  requireAdmin();
  const id = toId(bannerId);
  if (id === null || (direction !== 'up' && direction !== 'down')) return fail('That banner could not be moved.');
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('banners').select('id').order('sort_order', { ascending: true, nullsFirst: false }).order('id', { ascending: true });
  const ids = (data ?? []).map((row) => row.id as number);
  const index = ids.indexOf(id);
  const target = index + (direction === 'up' ? -1 : 1);
  if (index < 0) return fail('That banner no longer exists.');
  if (target < 0 || target >= ids.length) return succeed('Nothing to move.');
  [ids[index], ids[target]] = [ids[target], ids[index]];
  const results = await Promise.all(renumberWrites(ids).map((write) => supabase.from('banners').update({ sort_order: write.sort_order }).eq('id', write.id)));
  if (results.some((result) => result.error)) return fail('Could not reorder the banners.');
  refreshSite();
  return succeed('Banner order updated.', id);
}

export async function deleteBanner(bannerId: unknown): Promise<ActionResult> {
  requireAdmin();
  const id = toId(bannerId);
  if (id === null) return fail('That banner could not be identified.');
  const supabase = getSupabaseAdmin();
  const { data: banner } = await supabase.from('banners').select('id, image_url').eq('id', id).maybeSingle();
  if (!banner) return fail('That banner was already removed.');
  const { error } = await supabase.from('banners').delete().eq('id', id);
  if (error) return fail(`Could not remove the banner: ${error.message}`);

  const path = storagePathFromUrl(banner.image_url as string, supabaseUrl);
  if (path && path.startsWith(BANNER_PREFIX)) await removeObjects([path]);
  const { data: remaining } = await supabase.from('banners').select('image_url');
  const referenced = new Set((remaining ?? []).map((row) => storagePathFromUrl(row.image_url as string, supabaseUrl)).filter((p): p is string => Boolean(p)));
  await sweepOrphans(BANNER_PREFIX, referenced);

  refreshSite();
  return succeed('Banner removed.');
}
