import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',                    // Statikus export GitHub Pages-hez
  basePath: '/next-erme',              // ← FONTOS: cseréld ki a repo nevedre!
  assetPrefix: '/next-erme',           // ← ugyanaz, mint a basePath
  images: {
    unoptimized: true,                 // GitHub Pages nem támogatja az optimalizálást
  },
  trailingSlash: true,                 // Ajánlott statikus exportnál
};

export default nextConfig;