import { getDbPool } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const id = getRouterParam(event, 'id')
  const pool = getDbPool()

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID가 필요합니다.' })
  }

  // PUT: 주식 정보 또는 현재가 업데이트
  if (method === 'PUT') {
    const body = await readBody(event)
    const { stock_name, stock_code, market_type, quantity, avg_buy_price, current_price, note } = body

    await pool.query(
      `UPDATE stocks SET stock_name = ?, stock_code = ?, market_type = ?, quantity = ?, avg_buy_price = ?, current_price = ?, note = ? WHERE id = ?`,
      [
        stock_name,
        stock_code || '',
        market_type || 'DOMESTIC',
        Number(quantity) || 0,
        Number(avg_buy_price) || 0,
        Number(current_price) || 0,
        note || '',
        id
      ]
    )

    return { success: true }
  }

  // DELETE: 주식 삭제
  if (method === 'DELETE') {
    await pool.query('DELETE FROM stocks WHERE id = ?', [id])
    return { success: true }
  }
})
