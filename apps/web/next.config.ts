import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sellerstudio/ui", "@sellerstudio/shared"],
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: "/app/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
