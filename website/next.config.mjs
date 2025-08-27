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
