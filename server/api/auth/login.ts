/**
 * ====================================================================
 * 사용자 로그인 인증 API (/api/auth/login)
 * ====================================================================
 * - 아이디/비밀번호 검증 (기본: admin / admin)
 * - 성공 시 auth_token 쿠키 발급 및 사용자 프로필 반환
 */
import { getDbPool, initDatabase } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const username = (body.username || '').toString().trim()
  const password = (body.password || '').toString().trim()

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: '아이디와 비밀번호를 모두 입력해주세요.' })
  }

  // 1. 기본 admin / admin 계정인 경우 즉시 인증 허용
  if (username === 'admin' && password === 'admin') {
    setCookie(event, 'auth_token', 'admin_authenticated_session_token', {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    })

    return {
      success: true,
      message: '로그인되었습니다.',
      user: { username: 'admin', name: '관리자' }
    }
  }

  // 2. DB 사용자 조회
  try {
    await initDatabase()
    const pool = getDbPool()

    const [rows]: any = await pool.query(
      'SELECT username, password, name FROM users WHERE username = ?',
      [username]
    )

    if (rows && rows.length > 0 && rows[0].password === password) {
      setCookie(event, 'auth_token', 'admin_authenticated_session_token', {
        httpOnly: false,
        path: '/',
        maxAge: 60 * 60 * 24 * 7
      })

      return {
        success: true,
        message: '로그인되었습니다.',
        user: { username: rows[0].username, name: rows[0].name }
      }
    }

    throw createError({ statusCode: 401, statusMessage: '아이디 또는 비밀번호가 일치하지 않습니다.' })
  } catch (err: any) {
    throw createError({ statusCode: 401, statusMessage: '아이디 또는 비밀번호가 일치하지 않습니다.' })
  }
})
