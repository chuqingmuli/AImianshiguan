/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  webpack: (config, { isServer }) => {
    // 在服务端渲染时忽略 @coze/api 模块，防止 ReferenceError: self is not defined
    if (isServer) {
      config.externals = [...(config.externals || []), {
        '@coze/api': '@coze/api',
        '@coze/api/ws-tools': '@coze/api/ws-tools',
      }]
    }
    return config
  },
}

module.exports = nextConfig