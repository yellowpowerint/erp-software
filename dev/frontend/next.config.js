const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../..'),
  webpack: (config, { isServer }) => {
    // react-pdf/pdfjs-dist has an optional dependency on `canvas` for Node.
    // In Next.js builds this can be attempted even for client bundles.
    // We stub it out to keep builds working without native canvas.
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      canvas: false,
    };

    return config;
  },
};

module.exports = nextConfig;
