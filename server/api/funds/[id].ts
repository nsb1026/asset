import { getDbPool } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const id = getRouterParam(event, 'id')
  const pool = getDbPool()

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID가 필요합니다.' })
  }

  // PUT: 펀드 수정
  if (method === 'PUT') {
    const body = await readBody(event)
    const { fund_name, fund_code, fund_type, investment_amount, current_valuation, base_price, note } = body

    await pool.query(
      `UPDATE funds SET fund_name = ?, fund_code = ?, fund_type = ?, investment_amount = ?, current_valuation = ?, base_price = ?, note = ? WHERE id = ?`,
      [
        fund_name,
        fund_code || '',
        fund_type || '주식형',
        Number(investment_amount) || 0,
        Number(current_valuation) || 0,
        Number(base_price) || 1000,
        note || '',
        id
      ]
    )

    return { success: true }
  }

  // DELETE: 펀드 삭제
  if (method === 'DELETE') {
    await pool.query('DELETE FROM funds WHERE id = ?', [id])
    return { success: true }
  }
})
