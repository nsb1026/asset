import { getDbPool, initDatabase } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const pool = getDbPool()

  // GET: 계좌 목록 조회
  if (method === 'GET') {
    try {
      const [rows]: any = await pool.query('SELECT * FROM accounts ORDER BY bank_name ASC, id DESC')
      return { success: true, data: rows }
    } catch (err: any) {
      // 테이블이 없을 경우 자동 초기화 후 재시도
      await initDatabase()
      const [rows]: any = await pool.query('SELECT * FROM accounts ORDER BY bank_name ASC, id DESC')
      return { success: true, data: rows }
    }
  }

  // POST: 신규 계좌 추가
  if (method === 'POST') {
    const body = await readBody(event)
    const { bank_name, account_name, account_number, balance, note } = body

    if (!bank_name || !account_name) {
      throw createError({ statusCode: 400, statusMessage: '은행명과 계좌명은 필수입니다.' })
    }

    const [result]: any = await pool.query(
      'INSERT INTO accounts (bank_name, account_name, account_number, balance, note) VALUES (?, ?, ?, ?, ?)',
      [bank_name, account_name, account_number || '', Number(balance) || 0, note || '']
    )

    return { success: true, id: result.insertId }
  }
})
