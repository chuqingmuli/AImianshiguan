# 部署教程

## 项目部署到 GitHub + Vercel 完整教程

---

## 目录
1. [前置准备
2. [推送到 GitHub](#推送到-github
3. [通过 Vercel 部署](#通过-vercel-部署)
4. [环境变量配置](#环境变量配置)

---

## 前置准备

### 需要的账号
- GitHub 账号
- Vercel 账号（可以用 GitHub 账号登录）

---

## 推送到 GitHub

### 步骤 1：初始化 Git 仓库

在项目根目录下打开终端（PowerShell），依次执行：

```powershell
# 初始化 Git 仓库
git init

# 添加所有文件到暂存区
git add .

# 创建首次提交
git commit -m "Initial commit - AI 模拟面试项目"
```

### 步骤 2：在 GitHub 创建新仓库

1. 访问 [github.com/new](https://github.com/new)
2. 填写仓库名称（例如：`ai-interview-app`）
3. 选择 Public 或 Private
4. **不要**勾选 "Initialize this repository with a README
5. 点击 "Create repository"

### 步骤 3：推送到 GitHub

在终端中执行：

```powershell
# 添加远程仓库地址（替换下面的链接为你的仓库地址
git remote add origin https://github.com/你的用户名/仓库名.git

# 重命名分支为 main
git branch -M main

# 推送到 GitHub
git push -u origin main
```

---

## 通过 Vercel 部署

### 步骤 1：导入项目到 Vercel

1. 访问 [vercel.com](https://vercel.com) 并登录
2. 点击 "Import Project
3. 选择刚创建的 GitHub 仓库
4. 点击 "Import"

### 步骤 2：配置项目

Vercel 会自动识别这是 Next.js 项目，大部分配置已经通过 [vercel.json](vercel.json) 已经配置好了，直接点击 "Deploy" 即可。

---

## 环境变量配置

部署前需要在 Vercel 项目设置中配置以下环境变量：

| 变量名 | 说明 |
|--------|------|
| `DATABASE_URL` | 数据库连接字符串 |
| `NEXTAUTH_URL` | 你的应用 URL（部署后 Vercel 会提供） |
| `NEXTAUTH_SECRET` | NextAuth 密钥（可以用 `openssl rand -hex 32` 生成） |
| `COZE_API_KEY` | Coze API 密钥 |
| `COZE_BOT_ID_JAVA` | Java 面试 Bot ID |
| `COZE_BOT_ID_WEB` | Web 面试 Bot ID |

### 配置步骤：

1. 在 Vercel 项目页面点击 "Settings"
2. 左侧菜单选择 "Environment Variables"
3. 逐个添加上面的环境变量
4. 重新部署项目

---

## 本地开发

如果你想在本地运行项目：

```powershell
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

---

## 其他部署选项

### Netlify 部署
1. 访问 [netlify.com](https://netlify.com)
2. 导入 GitHub 仓库
3. 配置环境变量
4. 部署

### Railway 部署
适合需要数据库的应用
