import { getDbPool } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const id = getRouterParam(event, 'id')
  const pool = getDbPool()

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID가 필요합니다.' })
  }

  // PUT: 부동산 수정
  if (method === 'PUT') {
    const body = await readBody(event)
    const { property_name, property_type, location, acquisition_price, acquisition_date, note } = body

    await pool.query(
      `UPDATE real_estates SET property_name = ?, property_type = ?, location = ?, acquisition_price = ?, acquisition_date = ?, note = ? WHERE id = ?`,
      [
        property_name,
        property_type || '아파트',
        location || '',
        Number(acquisition_price) || 0,
        acquisition_date || null,
        note || '',
        id
      ]
    )

    return { success: true }
  }

  // DELETE: 부동산 삭제
  if (method === 'DELETE') {
    await pool.query('DELETE FROM real_estates WHERE id = ?', [id])
    return { success: true }
  }
})
