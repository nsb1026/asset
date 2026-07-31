/**
 * ====================================================================
 * 자산 스냅샷/이력 조회 및 저장 API (/api/history)
 * ====================================================================
 * - GET: 날짜순 자산 이력 목록 조회
 * - POST: 특정 날짜 자산 금액 저장 (수동 금액 입력 또는 현재 대시보드 자산 캡처)
 */
import { getDbPool, initDatabase } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const pool = getDbPool()

  // GET: 자산 이력 목록 조회 (날짜 오름차순)
  if (method === 'GET') {
    try {
      const [rows]: any = await pool.query('SELECT * FROM asset_history ORDER BY record_date ASC')
      return { success: true, data: rows }
    } catch (err: any) {
      await initDatabase()
      const [rows]: any = await pool.query('SELECT * FROM asset_history ORDER BY record_date ASC')
      return { success: true, data: rows }
    }
  }

  // POST: 신규 자산 이력/스냅샷 저장 (REPLACE INTO 또는 INSERT ON DUPLICATE KEY UPDATE)
  if (method === 'POST') {
    const body = await readBody(event)
    const {
      record_date,
      total_asset,
      bank_balance,
      stock_valuation,
      savings_amount,
      fund_valuation,
      real_estate_amount,
      note
    } = body

    if (!record_date) {
      throw createError({ statusCode: 400, statusMessage: '기록 날짜는 필수입니다.' })
    }

    const recDate = String(record_date).split('T')[0]

    await pool.query(
      `INSERT INTO asset_history 
        (record_date, total_asset, bank_balance, stock_valuation, savings_amount, fund_valuation, real_estate_amount, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        total_asset = VALUES(total_asset),
        bank_balance = VALUES(bank_balance),
        stock_valuation = VALUES(stock_valuation),
        savings_amount = VALUES(savings_amount),
        fund_valuation = VALUES(fund_valuation),
        real_estate_amount = VALUES(real_estate_amount),
        note = VALUES(note),
        updated_at = NOW()`,
      [
        recDate,
        Number(total_asset) || 0,
        Number(bank_balance) || 0,
        Number(stock_valuation) || 0,
        Number(savings_amount) || 0,
        Number(fund_valuation) || 0,
        Number(real_estate_amount) || 0,
        note || ''
      ]
    )

    return { success: true, message: `'${recDate}' 자산 스냅샷이 성공적으로 저장되었습니다.` }
  }
})
