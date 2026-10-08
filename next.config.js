/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  // تعطيل i18n مؤقتاً حتى يتم بناء النظام الأساسي
  // i18n: {
  //   locales: ['en', 'ar'],
  //   defaultLocale: 'en',
  //   localeDetection: false,
  // },
};

module.exports = nextConfig;