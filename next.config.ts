import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
  },
  // Allow Next build to succeed only when explicitly requested (e.g. unblock CI).
  // Default: CI/production builds fail on type errors for safety.
  typescript: {
    ignoreBuildErrors: process.env.NEXT_IGNORE_TS_ERRORS === "true",
  },
};

export default nextConfig;
