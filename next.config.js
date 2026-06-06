/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // On the server, mark Firebase as external so Next.js
      // doesn't try to bundle the node-esm version (which imports undici)
      const externals = Array.isArray(config.externals) ? config.externals : [];
      config.externals = [
        ...externals,
        ({ request }, callback) => {
          if (request && (request.startsWith('firebase') || request.startsWith('@firebase'))) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        },
      ];
    }
    return config;
  },
};

module.exports = nextConfig;
