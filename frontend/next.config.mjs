/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@lunark/api"],
  experimental: {
    serverComponentsExternalPackages: ["@libsql/client", "libsql"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push(
        /^@libsql\/.*/,
        "libsql"
      );
    }
    return config;
  },
};

export default nextConfig;
