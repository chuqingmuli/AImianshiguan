import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/common/Providers'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CodeCanvas - AI技术面试模拟平台',
  description: '在CodeCanvas上提升你的技术面试技巧，通过AI模拟面试获得专业反馈',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Providers>
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}