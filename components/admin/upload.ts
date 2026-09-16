import { IMAGE_MAX_EDGE, isImageMime, MAX_IMAGE_BYTES } from '@/lib/media';

/**
 * Prepares a phone photo in the browser before it is sent: orientation fixed,
 * longest edge capped, re-encoded as JPEG. A 6 MB camera photo typically
 * becomes 300–900 KB — a big difference on mobile data — and re-encoding also
 * strips EXIF metadata such as the GPS location of the kitchen.
 */
export async function prepareImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
    const scale = Math.min(1, IMAGE_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('no canvas');
    context.fillStyle = '#FAFAF8';
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86));
    if (blob && blob.size > 0) return blob;
  } catch {
    // Fall through to sending the original, if it is a format the site can show.
  }

  if (isImageMime(file.type) && file.size <= MAX_IMAGE_BYTES) return file;
  throw new Error('This photo format cannot be used. Please choose a JPEG or PNG photo.');
}

/** Sends a file to a signed Storage URL with real upload progress (fetch cannot report it). */
export function uploadToSignedUrl(url: string, blob: Blob, filename: string, onProgress: (fraction: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', url);
    request.setRequestHeader('x-upsert', 'false');
    request.timeout = 15 * 60 * 1000;

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(1);
        resolve();
        return;
      }
      let message = `Upload failed (${request.status}).`;
      try {
        const body = JSON.parse(request.responseText) as { message?: string };
        if (body.message) message = `Upload failed: ${body.message}`;
      } catch {
        /* keep the generic message */
      }
      reject(new Error(message));
    };
    request.onerror = () => reject(new Error('The connection dropped during upload. Please try again.'));
    request.ontimeout = () => reject(new Error('The upload took too long. Please try again on a stronger connection.'));

    const form = new FormData();
    form.append('cacheControl', '31536000');
    form.append('', blob, filename);
    request.send(form);
  });
}
