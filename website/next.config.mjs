import { withIntlayer } from "next-intlayer/server";

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    rules: {
      "*.md": {
        as: "*.ts",
        loaders: ["raw-loader"],
      },
    },
  },
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Map localized markdown doc URLs to the raw route, force plain text for broad client compatibility
        {
          source: "/:locale/:path*.mdx",
          destination: "/:locale/raw/:path*?format=txt",
        },
      ],
    };
  },
};

const config = withIntlayer(nextConfig);

export default config;
