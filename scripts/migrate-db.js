#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// 数据库迁移脚本
class DatabaseMigrator {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups')
    this.dbPath = path.join(process.cwd(), 'prisma', 'mianshiguan.db')
  }

  // 创建备份目录
  createBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true })
      console.log('✅ 创建备份目录')
    }
  }

  // 备份数据库
  backupDatabase() {
    this.createBackupDir()
    
    if (fs.existsSync(this.dbPath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupPath = path.join(this.backupDir, `mianshiguan-${timestamp}.db`)
      
      fs.copyFileSync(this.dbPath, backupPath)
      console.log(`✅ 数据库备份成功: ${backupPath}`)
      return backupPath
    } else {
      console.log('ℹ️  数据库文件不存在，跳过备份')
      return null
    }
  }

  // 执行数据库迁移
  migrate() {
    console.log('🚀 开始数据库迁移...')
    
    try {
      // 备份数据库
      const backupPath = this.backupDatabase()
      
      // 生成Prisma客户端
      console.log('🔧 生成Prisma客户端...')
      execSync('npx prisma generate', { stdio: 'inherit' })
      
      // 执行数据库推送
      console.log('🗄️  推送数据库架构...')
      execSync('npx prisma db push', { stdio: 'inherit' })
      
      // 运行种子数据
      if (fs.existsSync(path.join(process.cwd(), 'prisma', 'seed.js'))) {
        console.log('🌱 运行种子数据...')
        execSync('npm run db:seed', { stdio: 'inherit' })
      }
      
      console.log('🎉 数据库迁移成功！')
      return { success: true, backupPath }
      
    } catch (error) {
      console.error('❌ 数据库迁移失败:', error.message)
      return { success: false, error: error.message }
    }
  }

  // 回滚迁移
  rollback(backupPath) {
    if (!backupPath || !fs.existsSync(backupPath)) {
      console.error('❌ 没有可用的备份文件')
      return false
    }
    
    try {
      console.log('🔄 开始回滚数据库...')
      
      // 停止应用（如果运行中）
      try {
        execSync('pkill -f "npm start"', { stdio: 'ignore' })
      } catch (error) {
        // 忽略错误，应用可能未运行
      }
      
      // 恢复备份
      fs.copyFileSync(backupPath, this.dbPath)
      console.log(`✅ 从备份恢复数据库: ${backupPath}`)
      
      // 重新生成客户端
      execSync('npx prisma generate', { stdio: 'inherit' })
      
      console.log('🎉 数据库回滚成功！')
      return true
      
    } catch (error) {
      console.error('❌ 数据库回滚失败:', error.message)
      return false
    }
  }

  // 验证数据库
  validate() {
    console.log('🔍 验证数据库...')
    
    try {
      // 检查数据库连接
      execSync('npx prisma db status', { stdio: 'inherit' })
      
      // 验证模型
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')
      if (fs.existsSync(schemaPath)) {
        console.log('✅ Schema文件存在')
      } else {
        console.error('❌ Schema文件不存在')
        return false
      }
      
      console.log('✅ 数据库验证成功！')
      return true
      
    } catch (error) {
      console.error('❌ 数据库验证失败:', error.message)
      return false
    }
  }

  // 获取数据库状态
  status() {
    console.log('📊 数据库状态...')
    
    try {
      // 获取数据库信息
      const result = execSync('npx prisma db status', { encoding: 'utf8' })
      console.log(result)
      
      // 获取表信息
      console.log('\n📋 表信息:')
      execSync('npx prisma studio --browser none', { stdio: 'inherit' })
      
    } catch (error) {
      console.error('❌ 获取数据库状态失败:', error.message)
    }
  }
}

// CLI命令处理
function main() {
  const migrator = new DatabaseMigrator()
  const command = process.argv[2]
  
  switch (command) {
    case 'migrate':
      migrator.migrate()
      break
      
    case 'rollback':
      const backupPath = process.argv[3]
      if (backupPath) {
        migrator.rollback(backupPath)
      } else {
        console.error('❌ 请提供备份文件路径')
      }
      break
      
    case 'validate':
      migrator.validate()
      break
      
    case 'status':
      migrator.status()
      break
      
    case 'backup':
      migrator.backupDatabase()
      break
      
    default:
      console.log('🚀 CodeCanvas 数据库迁移工具')
      console.log('=' .repeat(40))
      console.log('可用命令:')
      console.log('  npm run migrate-db migrate     # 执行数据库迁移')
      console.log('  npm run migrate-db rollback <backup>  # 回滚到指定备份')
      console.log('  npm run migrate-db validate    # 验证数据库')
      console.log('  npm run migrate-db status      # 查看数据库状态')
      console.log('  npm run migrate-db backup      # 创建数据库备份')
      console.log('=' .repeat(40))
  }
}

if (require.main === module) {
  main()
}

module.exports = DatabaseMigrator