/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // No incluir módulos del servidor en el bundle del cliente
      config.resolve.fallback = {
        net: false,
        tls: false,
        fs: false,
        http2: false,
        child_process: false,
        // otros módulos de node que puedan ser necesarios
      };
    }
    return config;
  },
}

module.exports = nextConfig 