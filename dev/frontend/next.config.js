/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendBaseUrl = process.env.BACKEND_URL || 'https://mining-erp-backend.onrender.com';

    return [
      {
        source: '/api/:path*',
        destination: `${backendBaseUrl}/api/:path*`,
      },
    ];
  },
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
