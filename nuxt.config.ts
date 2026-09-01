import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss()
    ]
  },
  runtimeConfig: {
    dbHost: process.env.DB_HOST || '127.0.0.1',
    dbPort: process.env.DB_PORT || '3306',
    dbUser: process.env.DB_USER || 'sms',
    dbPassword: process.env.DB_PASSWORD || 'sms',
    dbName: process.env.DB_NAME || 'sms'
  },
  app: {
    head: {
      title: '자산 관리 시스템 (Asset Management)',
      meta: [
        { name: 'description', content: '개인 자산, 계좌, 주식 시세, 예적금 만기 이자를 종합 관리하는 대시보드' }
      ],
      link: [
        { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css' }
      ]
    }
  }
})
