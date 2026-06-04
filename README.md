# AI 模拟面试与能力提升软件

## 项目简介

一个基于 Next.js 的 AI 驱动的模拟面试平台，提供智能面试对话、能力评估和学习提升功能。

## 技术栈

- **框架**: Next.js 14.1.4
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI 组件**: Shadcn UI + Radix UI
- **认证**: NextAuth.js
- **数据库**: Prisma ORM + SQLite
- **AI 服务**: Coze API
- **语音**: Speech-to-Text + Text-to-Speech

## 功能特性

- 🎯 智能 AI 面试对话
- 💬 实时语音交互
- 📊 面试能力评估报告
- 📝 面试历史记录
- 👤 用户个人资料
- 🏆 技能提升建议

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装和运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

访问 http://localhost:3000 查看应用

## 部署

详细的部署教程请参考 [DEPLOY.md](./DEPLOY.md)

### 快速部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/你的用户名/仓库名)

## 环境变量

需要配置以下环境变量：

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
COZE_API_KEY="your-coze-api-key"
COZE_BOT_ID_JAVA="java-bot-id"
COZE_BOT_ID_WEB="web-bot-id"
LOG_LEVEL="info"
```

## 项目结构

```
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React 组件
│   ├── lib/             # 工具函数
│   ├── hooks/           # 自定义 Hooks
│   └── services/        # 业务逻辑服务
├── prisma/              # Prisma 数据库配置
├── public/              # 静态资源
└── scripts/             # 工具脚本
```

## 开发命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产服务器 |
| `npm run lint` | 代码检查 |
| `npm run db:push` | 推送数据库 schema |
| `npm run db:studio` | 打开 Prisma Studio |

## 许可证

MIT
