# CodeCanvas 部署指南

## 🚀 部署方式

### 1. Docker容器化部署

#### 构建镜像
```bash
docker build -t mianshiguan .
```

#### 运行容器
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="file:/app/data/mianshiguan.db" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXTAUTH_SECRET="your-secret-key" \
  -e COZE_API_KEY="your-coze-api-key" \
  -e COZE_BOT_ID_JAVA="your-java-bot-id" \
  -e COZE_BOT_ID_WEB="your-web-bot-id" \
  -v ./data:/app/data \
  mianshiguan
```

#### 使用Docker Compose
```bash
# 创建.env文件配置环境变量
cp .env.example .env
# 编辑.env文件配置环境变量

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 2. Vercel部署

#### 前提条件
- Vercel账号
- Git仓库

#### 部署步骤
1. 安装Vercel CLI
```bash
npm install -g vercel
```

2. 登录Vercel
```bash
vercel login
```

3. 部署项目
```bash
vercel
```

4. 配置环境变量
在Vercel控制台配置以下环境变量：
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `COZE_API_KEY`
- `COZE_BOT_ID_JAVA`
- `COZE_BOT_ID_WEB`

### 3. 手动部署

#### 生产环境构建
```bash
# 验证环境变量
npm run validate-env

# 执行生产构建
npm run build-prod

# 启动服务
npm start
```

## 🗄️ 数据库管理

### 数据库迁移
```bash
# 执行迁移
npm run migrate-db migrate

# 验证数据库
npm run migrate-db validate

# 查看数据库状态
npm run migrate-db status

# 创建数据库备份
npm run migrate-db backup

# 回滚数据库
npm run migrate-db rollback <backup-file-path>
```

### 数据库工具
```bash
# 启动数据库管理界面
npm run db:studio

# 重置数据库
npm run db:reset

# 运行种子数据
npm run db:seed
```

## 🔧 环境变量配置

### 必需的环境变量
```bash
# 数据库配置
DATABASE_URL="file:./mianshiguan.db"

# NextAuth配置
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret-key-here"

# Coze API配置
COZE_API_KEY="your-coze-api-key"
COZE_BOT_ID_JAVA="your-java-bot-id"
COZE_BOT_ID_WEB="your-web-bot-id"

# 环境配置
NODE_ENV="production"
LOG_LEVEL="info"
PORT="3000"
```

### 可选的环境变量
```bash
# OAuth配置（可选）
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"

GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## 📊 监控和维护

### 健康检查
```bash
# 检查服务健康状态
curl http://localhost:3001/api/health
```

### 日志管理
```bash
# 查看Docker日志
docker-compose logs -f

# 查看应用日志
tail -f .next/logs/production.log
```

### 性能监控
- 使用Docker stats监控资源使用
- 配置Prometheus和Grafana进行性能监控

## 🔒 安全建议

1. **环境变量管理**
   - 使用密钥管理服务存储敏感信息
   - 避免在代码中硬编码密钥

2. **数据库安全**
   - 定期备份数据库
   - 限制数据库访问权限

3. **应用安全**
   - 启用HTTPS
   - 设置适当的CORS策略
   - 定期更新依赖包

4. **访问控制**
   - 实施强密码策略
   - 使用OAuth认证
   - 配置适当的权限控制

## 🚨 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查DATABASE_URL配置
   - 验证数据库文件权限

2. **Coze API错误**
   - 检查COZE_API_KEY是否有效
   - 验证Bot ID配置

3. **端口冲突**
   - 修改docker-compose.yml中的端口映射
   - 检查是否有其他服务占用端口

4. **内存不足**
   - 增加容器内存限制
   - 优化应用性能

## 📝 部署清单

- [ ] 配置环境变量
- [ ] 执行数据库迁移
- [ ] 构建生产版本
- [ ] 配置健康检查
- [ ] 设置监控告警
- [ ] 配置备份策略
- [ ] 测试服务可用性

## 📞 支持

如有问题，请查看：
- GitHub Issues: https://github.com/your-repo/issues
- 文档：https://your-docs-url.com
- 支持邮箱：support@yourdomain.com