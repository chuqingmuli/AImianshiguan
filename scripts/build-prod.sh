#!/bin/bash

# CodeCanvas 生产环境构建脚本

set -e

echo "🚀 开始构建生产环境..."

# 检查环境变量
echo "🔍 检查环境变量..."
if [ -z "$DATABASE_URL" ]; then
  echo "❌ 错误: 未设置 DATABASE_URL 环境变量"
  exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
  echo "❌ 错误: 未设置 NEXTAUTH_SECRET 环境变量"
  exit 1
fi

if [ -z "$COZE_API_KEY" ]; then
  echo "❌ 错误: 未设置 COZE_API_KEY 环境变量"
  exit 1
fi

# 清理依赖
echo "🧹 清理旧的依赖..."
rm -rf node_modules
rm package-lock.json

# 安装依赖
echo "📦 安装依赖..."
npm ci --only=production

# 数据库迁移
echo "🗄️  执行数据库迁移..."
npx prisma generate
npx prisma db push

# 构建应用
echo "🏗️  构建应用..."
npm run build

# 验证构建结果
echo "✅ 验证构建结果..."
if [ ! -d ".next" ]; then
  echo "❌ 构建失败: .next 目录不存在"
  exit 1
fi

echo "🎉 构建完成！"
echo "🚀 应用已准备就绪，可以部署了。"