import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: 'http', hostname: '127.0.0.1', port: '54321', pathname: '/storage/v1/object/public/**' },
      { protocol: "https", hostname: "www.elinerstourscarhire.com", pathname: "/**" },
      { protocol: "https", hostname: "mlzkqf6h7v50.i.optimole.com", pathname: "/**" },
      { protocol: "https", hostname: "taroskaexecutives.com", pathname: "/**" },
      { protocol: "https", hostname: "media-cdn.tripadvisor.com", pathname: "/**" },
      { protocol: "https", hostname: "media.autochek.africa", pathname: "/**" },
      { protocol: "https", hostname: "kai-and-karo.ams3.cdn.digitaloceanspaces.com", pathname: "/**" },
      { protocol: "https", hostname: "media.dealersyard.com", pathname: "/**" },
      { protocol: "https", hostname: "gybird.co.ke", pathname: "/**" },
    ],
  },
};

export default nextConfig;
