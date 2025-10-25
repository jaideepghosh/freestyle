/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure Next compiles and processes CSS from the local UI package
  transpilePackages: ["@freestyle/ui", "@freestyle/locales"],
};

export default nextConfig;
