'use client';

import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

/**
 * Renders a QR code for /t/[token] entirely in the browser, from
 * window.location.origin — never a hardcoded domain or a build-time env var,
 * so the code always encodes whatever address the admin is actually open on.
 * SVG rather than a raster image, so it stays crisp at any print size.
 */
export function TableQr({ token, size = 128, className }: { token: string; size?: number; className?: string }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const url = `${window.location.origin}/t/${token}`;
    QRCode.toString(url, { type: 'svg', margin: 1, width: size })
      .then((markup) => {
        if (!cancelled) setSvg(markup);
      })
      .catch(() => {
        if (!cancelled) setSvg(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token, size]);

  return (
    <div
      role="img"
      aria-label={`QR: /t/${token}`}
      className={className}
      style={{ width: size, height: size }}
      // The markup is generated locally from a URL we built ourselves — never user input.
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}

/** The full /t/[token] URL on whatever domain the admin is currently open on. */
export function tableUrl(token: string): string {
  if (typeof window === 'undefined') return `/t/${token}`;
  return `${window.location.origin}/t/${token}`;
}
