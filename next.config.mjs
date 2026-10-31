/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep less duplicate cache data on the heap in the 512 MiB runtime.
  // Next's filesystem cache and existing revalidation intervals stay enabled.
  cacheMaxMemorySize: 16 * 1024 * 1024,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "ddfcdn.realtor.ca"
      }
    ]
  }
};

export default nextConfig;
