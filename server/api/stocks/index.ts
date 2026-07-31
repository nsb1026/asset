import { getDbPool, initDatabase } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const pool = getDbPool()

  // GET: 보유 주식 목록 조회
  if (method === 'GET') {
    try {
      const [rows]: any = await pool.query('SELECT * FROM stocks ORDER BY stock_name ASC, id DESC')
      return { success: true, data: rows }
    } catch (err: any) {
      await initDatabase()
      const [rows]: any = await pool.query('SELECT * FROM stocks ORDER BY stock_name ASC, id DESC')
      return { success: true, data: rows }
    }
  }

  // POST: 신규 주식 추가
  if (method === 'POST') {
    const body = await readBody(event)
    const { stock_name, stock_code, market_type, quantity, avg_buy_price, current_price, note } = body

    if (!stock_name) {
      throw createError({ statusCode: 400, statusMessage: '종목명은 필수입니다.' })
    }

    const [result]: any = await pool.query(
      `INSERT INTO stocks (stock_name, stock_code, market_type, quantity, avg_buy_price, current_price, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        stock_name,
        stock_code || '',
        market_type || 'DOMESTIC',
        Number(quantity) || 0,
        Number(avg_buy_price) || 0,
        Number(current_price) || 0,
        note || ''
      ]
    )

    return { success: true, id: result.insertId }
  }
})
