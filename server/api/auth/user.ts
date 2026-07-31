/**
 * ====================================================================
 * 사용자 인증 상태 확인 API (/api/auth/user)
 * ====================================================================
 */
export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')

  if (token && token === 'admin_authenticated_session_token') {
    return {
      authenticated: true,
      user: { username: 'admin', name: '관리자' }
    }
  }

  return {
    authenticated: false,
    user: null
  }
})
