/**
 * ====================================================================
 * 글로벌 인증 미들웨어 (middleware/auth.global.ts)
 * ====================================================================
 * - 비로그인 사용자가 서비스 페이지 접근 시 /login 페이지로 자동 이동
 * - 로그인된 사용자가 /login 접근 시 메인 대시보드(/)로 리다이렉트
 */
export default defineNuxtRouteMiddleware((to) => {
  // 클라이언트 및 서버 쿠키 확인
  const authToken = useCookie('auth_token')

  const isAuthenticated = Boolean(authToken.value && authToken.value === 'admin_authenticated_session_token')

  // 1. 비로그인 사용자가 /login 이외의 페이지에 접근할 경우
  if (!isAuthenticated && to.path !== '/login') {
    return navigateTo('/login')
  }

  // 2. 이미 로그인된 사용자가 /login 페이지에 접근할 경우
  if (isAuthenticated && to.path === '/login') {
    return navigateTo('/')
  }
})
