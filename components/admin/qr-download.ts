import QRCode from 'qrcode';

/** A safe file name: letters, digits and dashes only ("Stol 7/A" → "stol-7-a"). */
export function fileSlug(value: string, fallback: string): string {
  const slug = value
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/[^A-Za-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return slug || fallback;
}

function save(href: string, filename: string): void {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * A large PNG (1200px, with a proper quiet zone) for printing or handing to a
 * designer. Generated in the browser from the address the admin is open on.
 */
export async function downloadQrPng(path: string, name: string): Promise<void> {
  const url = `${window.location.origin}${path}`;
  const dataUrl = await QRCode.toDataURL(url, { width: 1200, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } });
  save(dataUrl, `${name}.png`);
}

/** The same code as a vector SVG — scales to any size without going soft. */
export async function downloadQrSvg(path: string, name: string): Promise<void> {
  const url = `${window.location.origin}${path}`;
  const markup = await QRCode.toString(url, { type: 'svg', margin: 4, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } });
  const href = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
  save(href, `${name}.svg`);
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}
