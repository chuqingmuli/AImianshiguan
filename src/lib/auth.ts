import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import prisma from './prisma'
import GitHubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface JWT {
    id: string
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    // 添加基于用户名和密码的认证方案（仅用于开发环境）
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: {
          label: '用户名',
          type: 'text',
          placeholder: '请输入用户名',
        },
        password: {
          label: '密码',
          type: 'password',
          placeholder: '请输入密码',
        },
      },
      async authorize(credentials) {
        // 简单的开发环境认证
        // 实际生产环境应该使用数据库验证
        if (credentials?.username && credentials?.password) {
          // 检查是否为开发环境默认用户
          if (credentials.username === 'admin' && credentials.password === 'admin123') {
            // 查找或创建用户
            let user = await prisma.user.findUnique({
              where: { email: 'admin@example.com' },
            })
            
            if (!user) {
              user = await prisma.user.create({
                data: {
                  name: 'Admin User',
                  email: 'admin@example.com',
                  emailVerified: new Date(),
                },
              })
            }
            
            return user
          }
          
          // 为任何输入的用户名创建用户（仅开发环境）
          let user = await prisma.user.findUnique({
            where: { email: `${credentials.username}@example.com` },
          })
          
          if (!user) {
            user = await prisma.user.create({
              data: {
                name: credentials.username,
                email: `${credentials.username}@example.com`,
                emailVerified: new Date(),
              },
            })
          }
          
          return user
        }
        
        return null
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}