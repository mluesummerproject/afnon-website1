// A Codespace serves the app through a forwarded-port proxy, so the browser's
// Origin header is the forwarded domain while Next only knows the container's
// own Host - without this, every Server Action (including admin login) is
// rejected as a cross-origin request. Derived from the Codespace's own env
// vars so a rebuilt/renamed Codespace picks up the right domain automatically.
const codespaceOrigin =
  process.env.CODESPACE_NAME && process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN
    ? `https://${process.env.CODESPACE_NAME}-3000.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`
    : null;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  images: {
    unoptimized: true,
    // Remote photography source. Replace/extend when the restaurant's own
    // photography is hosted (e.g. Supabase Storage or a CDN).
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', ...(codespaceOrigin ? [codespaceOrigin] : [])],
    },
  },
};

export default nextConfig;
