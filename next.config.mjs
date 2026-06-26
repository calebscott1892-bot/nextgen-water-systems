/** @type {import('next').NextConfig} */
// Static export for GitHub Pages (project page served at /<repo>/).
// basePath/assetPrefix only apply in production so `next dev` stays at root.
const repo = "nextgen-water-systems";
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isProd ? `/${repo}` : undefined,
  assetPrefix: isProd ? `/${repo}/` : undefined,
};

export default nextConfig;
