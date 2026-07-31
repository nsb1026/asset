import { getDbPool, initDatabase } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const pool = getDbPool()

  // GET: 부동산 목록 조회
  if (method === 'GET') {
    try {
      const [rows]: any = await pool.query('SELECT * FROM real_estates ORDER BY property_name ASC, id DESC')
      return { success: true, data: rows }
    } catch (err: any) {
      await initDatabase()
      const [rows]: any = await pool.query('SELECT * FROM real_estates ORDER BY property_name ASC, id DESC')
      return { success: true, data: rows }
    }
  }

  // POST: 신규 부동산 등록
  if (method === 'POST') {
    const body = await readBody(event)
    const { property_name, property_type, location, acquisition_price, acquisition_date, note } = body

    if (!property_name) {
      throw createError({ statusCode: 400, statusMessage: '부동산명은 필수입니다.' })
    }

    const [result]: any = await pool.query(
      `INSERT INTO real_estates (property_name, property_type, location, acquisition_price, acquisition_date, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        property_name,
        property_type || '아파트',
        location || '',
        Number(acquisition_price) || 0,
        acquisition_date || null,
        note || ''
      ]
    )

    return { success: true, id: result.insertId }
  }
})
