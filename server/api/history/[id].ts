/**
 * ====================================================================
 * 자산 스냅샷 이력 수정 및 삭제 API (/api/history/[id])
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

  // PUT: 이력 수정
  if (method === 'PUT') {
    const body = await readBody(event)
    const { record_date, total_asset, note } = body

    await pool.query(
      `UPDATE asset_history SET record_date = ?, total_asset = ?, note = ? WHERE id = ?`,
      [
        String(record_date).split('T')[0],
        Number(total_asset) || 0,
        note || '',
        id
      ]
    )

    return { success: true }
  }

  // DELETE: 이력 삭제
  if (method === 'DELETE') {
    await pool.query('DELETE FROM asset_history WHERE id = ?', [id])
    return { success: true }
  }
})
