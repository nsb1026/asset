import { getDbPool, initDatabase } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const pool = getDbPool()

  // GET: 펀드 목록 조회
  if (method === 'GET') {
    try {
      const [rows]: any = await pool.query('SELECT * FROM funds ORDER BY fund_name ASC, id DESC')
      return { success: true, data: rows }
    } catch (err: any) {
      await initDatabase()
      const [rows]: any = await pool.query('SELECT * FROM funds ORDER BY fund_name ASC, id DESC')
      return { success: true, data: rows }
    }
  }

  // POST: 신규 펀드 등록
  if (method === 'POST') {
    const body = await readBody(event)
    const { fund_name, fund_code, fund_type, investment_amount, current_valuation, base_price, note } = body

    if (!fund_name) {
      throw createError({ statusCode: 400, statusMessage: '펀드명은 필수입니다.' })
    }

    const inv = Number(investment_amount) || 0
    const val = Number(current_valuation) || inv

    const [result]: any = await pool.query(
      `INSERT INTO funds (fund_name, fund_code, fund_type, investment_amount, current_valuation, base_price, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        fund_name,
        fund_code || '',
        fund_type || '주식형',
        inv,
        val,
        Number(base_price) || 1000,
        note || ''
      ]
    )

    return { success: true, id: result.insertId }
  }
})
