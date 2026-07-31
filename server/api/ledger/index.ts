/**
 * ====================================================================
 * 가계부 일별 내역 조회 및 수동 등록 API (/api/ledger)
 * ====================================================================
 * - GET: 가계부 내역 목록 조회 (연도, 월 필터링 지원)
 * - POST: 일별 수입/지출 내역 수동 추가
 */
import { getDbPool, initDatabase } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const pool = getDbPool()

  // GET: 가계부 목록 조회
  if (method === 'GET') {
    const query = getQuery(event)
    const year = query.year ? String(query.year) : null
    const month = query.month ? String(query.month).padStart(2, '0') : null

    try {
      let sql = 'SELECT * FROM ledger_entries'
      const params: any[] = []

      if (year && month) {
        sql += ' WHERE entry_date LIKE ?'
        params.push(`${year}-${month}-%`)
      } else if (year) {
        sql += ' WHERE entry_date LIKE ?'
        params.push(`${year}-%`)
      }

      sql += ' ORDER BY entry_date DESC, id DESC'

      const [rows]: any = await pool.query(sql, params)
      return { success: true, data: rows }
    } catch (err: any) {
      await initDatabase()
      const [rows]: any = await pool.query('SELECT * FROM ledger_entries ORDER BY entry_date DESC, id DESC')
      return { success: true, data: rows }
    }
  }

  // POST: 신규 가계부 수입/지출 항목 수동 추가
  if (method === 'POST') {
    const body = await readBody(event)
    const { entry_date, entry_type, category, amount, memo } = body

    if (!entry_date || !amount) {
      throw createError({ statusCode: 400, statusMessage: '날짜와 금액은 필수입니다.' })
    }

    const eDate = String(entry_date).split('T')[0]

    const [result]: any = await pool.query(
      `INSERT INTO ledger_entries (entry_date, entry_type, category, amount, memo)
       VALUES (?, ?, ?, ?, ?)`,
      [
        eDate,
        entry_type || 'EXPENSE',
        category || '기타',
        Number(amount) || 0,
        memo || ''
      ]
    )

    return { success: true, id: result.insertId }
  }
})
