/** @type {import('next').NextConfig} */
import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  // Ensure Next compiles and processes CSS from the local UI package
  transpilePackages: ["@freestyle/ui", "@freestyle/locales"],
};

export default withNextIntl(nextConfig);
