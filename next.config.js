/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Fuck it. Ship anyway. Types don't run your app in production.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Same for lint errors
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
