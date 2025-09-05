/** @type {import('next').NextConfig} */
// const nextConfig = {};
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    BROWSERBASE_API_KEY: process.env.BROWSERBASE_API_KEY,
    BROWSERBASE_PROJECT_ID: process.env.BROWSERBASE_PROJECT_ID,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
}


export default nextConfig;
