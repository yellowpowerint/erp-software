/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Allow production builds to complete even with ESLint warnings
    ignoreDuringBuilds: true,
  },
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

    // Ignore canvas module completely for client-side builds
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }

    // Add externals for canvas to prevent webpack from trying to bundle it
    config.externals = config.externals || [];
    config.externals.push({
      canvas: 'canvas',
    });

    return config;
  },
};

module.exports = nextConfig;
