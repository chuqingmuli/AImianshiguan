// 应用配置
export interface Config {
  db: {
    url: string | undefined
  }
  coze: {
    apiKey: string | undefined
    botIds: {
      java: string | undefined
      web: string | undefined
    }
  }
  app: {
    url: string | undefined
  }
}

// 应用配置
const config: Config = {
  db: { url: process.env.DATABASE_URL },
  coze: {
    apiKey: process.env.COZE_API_KEY,
    botIds: {
      java: process.env.COZE_BOT_ID_JAVA,
      web: process.env.COZE_BOT_ID_WEB
    }
  },
  app: { url: process.env.NEXTAUTH_URL }
}

export default config