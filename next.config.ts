import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-d3065036-5ae2-4670-9b9c-31edefae35fb.space.z.ai",
  ],
};

export default nextConfig;
