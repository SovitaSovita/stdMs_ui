import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";



const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: "./messages/en.json",
  },
});

const nextConfig: NextConfig = {
  /* config options here */

  // Proxy to Backend coz my backend have no https
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://209.146.62.96:4545/:path*',
      },
    ];
  },
};

export default withNextIntl(nextConfig);
