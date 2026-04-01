import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath: "/classical-concepts-1",
  assetPrefix: "/classical-concepts-1/",
  trailingSlash: true,
};

export default nextConfig;
