import Link from 'next/link'
import { User, Github, Twitter, Linkedin, Mail, Phone } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="bg-gray-100 rounded-lg p-2">
                <User className="h-6 w-6 text-gray-700" />
              </div>
              <span className="text-xl font-semibold">CodeCanvas</span>
            </Link>
            <p className="text-gray-600 max-w-md leading-relaxed">
              CodeCanvas AI平台专为计算机岗位打造，通过AI模拟面试提升你的技术面试技巧和职业能力，让你在真实面试中更加自信和出色。
            </p>
            <div className="flex gap-4 mt-6">
              <Link href="#" className="text-gray-600 hover:text-gray-900">
                <Github className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900">
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-6">快速链接</h3>
            <ul className="space-y-4">
              <li><Link href="/dashboard" className="text-gray-600 hover:text-gray-900">仪表盘</Link></li>
              <li><Link href="/interviews" className="text-gray-600 hover:text-gray-900">模拟面试</Link></li>
              <li><Link href="/skills" className="text-gray-600 hover:text-gray-900">技能管理</Link></li>
              <li><Link href="/assessments" className="text-gray-600 hover:text-gray-900">能力评估</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-6">资源</h3>
            <ul className="space-y-4">
              <li><Link href="#" className="text-gray-600 hover:text-gray-900">帮助中心</Link></li>
              <li><Link href="#" className="text-gray-600 hover:text-gray-900">面试技巧</Link></li>
              <li><Link href="#" className="text-gray-600 hover:text-gray-900">常见问题</Link></li>
              <li><Link href="#" className="text-gray-600 hover:text-gray-900">联系我们</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-16 pt-12 flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-sm text-gray-600">
            <Link href="#" className="hover:text-gray-900">隐私政策</Link>
            <Link href="#" className="hover:text-gray-900">服务条款</Link>
            <Link href="#" className="hover:text-gray-900">Cookie政策</Link>
          </div>
          <p className="text-sm text-gray-600 mt-4 md:mt-0">
            © {currentYear} CodeCanvas AI平台. 保留所有权利.
          </p>
        </div>
      </div>
    </footer>
  )
}