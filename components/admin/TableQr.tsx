'use client';

import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

/**
 * QR codes are drawn entirely in the browser, from window.location.origin —
 * never a hardcoded domain or a build-time env var — so a code always encodes
 * whatever address the admin is actually open on. SVG rather than a raster
 * image, so it stays crisp at any print size.
 */
function QrSvg({ path, size, label, className }: { path: string; size: number; label: string; className?: string }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(`${window.location.origin}${path}`, { type: 'svg', margin: 1, width: size })
      .then((markup) => {
        if (!cancelled) setSvg(markup);
      })
      .catch(() => {
        if (!cancelled) setSvg(null);
      });
    return () => {
      cancelled = true;
    };
  }, [path, size]);

  return (
    <div
      role="img"
      aria-label={label}
      className={className}
      style={{ width: size, height: size }}
      // The markup is generated locally from a URL we built ourselves — never user input.
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}

/** The QR for one table: /t/[token]. */
export function TableQr({ token, size = 128, className }: { token: string; size?: number; className?: string }) {
  return <QrSvg path={`/t/${token}`} size={size} label={`QR: /t/${token}`} className={className} />;
}

/** The QR for the homepage itself — not tied to any table. */
export function SiteQr({ size = 176, className }: { size?: number; className?: string }) {
  return <QrSvg path="/" size={size} label="QR: /" className={className} />;
}

/** The full /t/[token] URL on whatever domain the admin is currently open on. */
export function tableUrl(token: string): string {
  if (typeof window === 'undefined') return `/t/${token}`;
  return `${window.location.origin}/t/${token}`;
}
