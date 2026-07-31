import { getDbPool } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const id = getRouterParam(event, 'id')
  const pool = getDbPool()

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID가 필요합니다.' })
  }

  // PUT: 예적금 정보 수정
  if (method === 'PUT') {
    const body = await readBody(event)
    const {
      bank_name,
      product_name,
      savings_type,
      principal,
      period_months,
      interest_rate,
      tax_type,
      start_date,
      maturity_date,
      note
    } = body

    await pool.query(
      `UPDATE savings SET 
        bank_name = ?, 
        product_name = ?, 
        savings_type = ?, 
        principal = ?, 
        period_months = ?, 
        interest_rate = ?, 
        tax_type = ?, 
        start_date = ?, 
        maturity_date = ?, 
        note = ? 
      WHERE id = ?`,
      [
        bank_name,
        product_name,
        savings_type || 'DEPOSIT',
        Number(principal) || 0,
        Number(period_months) || 12,
        Number(interest_rate) || 0,
        tax_type || 'NORMAL',
        start_date || null,
        maturity_date || null,
        note || '',
        id
      ]
    )

    return { success: true }
  }

  // DELETE: 예적금 삭제
  if (method === 'DELETE') {
    await pool.query('DELETE FROM savings WHERE id = ?', [id])
    return { success: true }
  }
})
