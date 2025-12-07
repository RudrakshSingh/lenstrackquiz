// next.config.mjs
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Prevent Vercel deployments from failing due to lint errors
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  // Set outputFileTracingRoot to silence workspace root warning
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
