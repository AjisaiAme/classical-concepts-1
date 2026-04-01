import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath: isProd ? "/classical-concepts-1" : "",
  assetPrefix: isProd ? "/classical-concepts-1/" : "",
  trailingSlash: true,
};

export default nextConfig;
