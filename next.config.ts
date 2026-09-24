import type { NextConfig } from "next";

// Las imágenes de productos se sirven desde Supabase Storage (bucket público "productos").
const urlSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: urlSupabase
      ? [new URL(`${urlSupabase.replace(/\/+$/, "")}/storage/v1/object/public/**`)]
      : [],
  },
};

export default nextConfig;
