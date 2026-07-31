/**
 * ====================================================================
 * 로그아웃 처리 API (/api/auth/logout)
 * ====================================================================
 * - auth_token 쿠키 제거
 */
export default defineEventHandler(async (event) => {
  deleteCookie(event, 'auth_token', { path: '/' })
  return { success: true, message: '로그아웃 되었습니다.' }
})
