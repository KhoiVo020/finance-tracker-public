import type { MetadataRoute } from 'next';

const appName = 'Finance Tracker';
const appDescription = 'Track transactions, statements, groceries, and categories.';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appName,
    short_name: 'Finance',
    description: appDescription,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0B0A10',
    theme_color: '#0B0A10',
    orientation: 'portrait',
    categories: ['finance', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
