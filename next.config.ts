/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**", // 🔹 Permite cualquier imagen dentro del dominio
      },
    ],
  },
};

module.exports = nextConfig;
