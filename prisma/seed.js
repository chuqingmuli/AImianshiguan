const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('开始填充示例数据...')

  // 创建示例用户
  const demoUser = await prisma.user.create({
    data: {
      name: '演示用户',
      email: 'demo@codecanvas.com',
      password: 'password123',
    },
  })

  console.log(`创建用户: ${demoUser.email}`)

  // 创建示例简历
  const resume = await prisma.resume.create({
    data: {
      userId: demoUser.id,
      content: '张三，5年前端开发经验，熟练掌握React、Vue等前端框架，参与过多个大型项目开发。',
      fileUrl: 'https://example.com/resume.pdf',
      parsedData: JSON.stringify({
        name: '张三',
        experience: '5年',
        skills: ['React', 'Vue', 'JavaScript', 'TypeScript'],
        projects: ['项目A', '项目B']
      }),
    },
  })

  console.log(`创建简历: ${resume.id}`)

  // 创建示例面试
  const interview = await prisma.interview.create({
    data: {
      userId: demoUser.id,
      type: 'web',
      status: 'completed',
      title: '前端开发工程师面试',
      description: '针对前端开发岗位的技术面试模拟',
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(),
      duration: 3600,
    },
  })

  console.log(`创建面试: ${interview.title}`)

  // 创建示例消息
  const messages = await prisma.message.createMany({
    data: [
      {
        interviewId: interview.id,
        role: 'assistant',
        content: '欢迎参加CodeCanvas面试。请简单介绍一下你的技术背景和工作经验。',
      },
      {
        interviewId: interview.id,
        role: 'user',
        content: '我有5年前端开发经验，主要使用React和TypeScript，参与过多个大型电商项目的开发。',
      },
      {
        interviewId: interview.id,
        role: 'assistant',
        content: '很好。请解释一下React中的组件生命周期，并说明在React 18中有哪些变化？',
      },
      {
        interviewId: interview.id,
        role: 'user',
        content: 'React组件生命周期包括挂载、更新和卸载三个阶段。在React 18中，引入了并发特性，render阶段可能被中断和重新执行，因此getDerivedStateFromProps等方法的行为发生了变化。',
      },
      {
        interviewId: interview.id,
        role: 'assistant',
        content: '请描述一下你如何优化React应用的性能？',
      },
      {
        interviewId: interview.id,
        role: 'user',
        content: '我通常会使用React.memo、useMemo和useCallback来避免不必要的重渲染，合理使用虚拟列表处理大量数据，以及使用代码分割来减小初始加载体积。',
      },
    ],
  })

  console.log(`创建消息: ${messages.count} 条`)

  // 创建示例评估报告
  const evaluation = await prisma.evaluationReport.create({
    data: {
      interviewId: interview.id,
      scores: JSON.stringify({
        technical: 85,
        communication: 90,
        problemSolving: 80,
        knowledgeDepth: 88,
        overall: 86,
      }),
      feedback: '候选人前端技术基础扎实，对React有深入理解，沟通表达清晰，能够很好地解释技术概念。建议加强算法和系统设计方面的学习。',
      strengths: '前端技术熟练，沟通能力强，问题分析思路清晰',
      improvements: '需要加强算法基础，系统设计经验不足',
    },
  })

  console.log(`创建评估报告: ${evaluation.id}`)

  console.log('数据填充完成！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })