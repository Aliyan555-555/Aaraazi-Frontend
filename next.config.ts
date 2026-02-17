import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
    ],
  },
  // TODO: Remove this override once outstanding TypeScript issues are resolved.
  // By default, fail the build on TypeScript errors; allow an explicit env-based escape hatch.
  typescript: {
    ignoreBuildErrors: process.env.NEXT_IGNORE_TS_ERRORS === "true",
  },
};

export default nextConfig;
