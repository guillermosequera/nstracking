import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Eliminar el rewrites ya que no es necesario
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve('src');
    return config;
  },
};

export default nextConfig;