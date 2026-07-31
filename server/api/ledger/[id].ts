/**
 * ====================================================================
 * 가계부 수입/지출 내역 수정 및 삭제 API (/api/ledger/[id])
 * ====================================================================
 */
import { getDbPool } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const id = getRouterParam(event, 'id')
  const pool = getDbPool()

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID가 필요합니다.' })
  }

  // PUT: 내역 수정
  if (method === 'PUT') {
    const body = await readBody(event)
    const { entry_date, entry_type, category, amount, memo } = body

    await pool.query(
      `UPDATE ledger_entries SET entry_date = ?, entry_type = ?, category = ?, amount = ?, memo = ? WHERE id = ?`,
      [
        String(entry_date).split('T')[0],
        entry_type || 'EXPENSE',
        category || '기타',
        Number(amount) || 0,
        memo || '',
        id
      ]
    )

    return { success: true }
  }

  // DELETE: 내역 삭제
  if (method === 'DELETE') {
    await pool.query('DELETE FROM ledger_entries WHERE id = ?', [id])
    return { success: true }
  }
})
