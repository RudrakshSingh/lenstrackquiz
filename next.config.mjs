// next.config.mjs
const nextConfig = {
  experimental: {
    allowedDevOrigins: ["http://192.168.29.52:3000"],
  },
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
};

export default nextConfig;
