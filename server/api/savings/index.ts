import { getDbPool, initDatabase } from '../../utils/db'
import { calculateSavingsMaturity } from '../../utils/savingsCalc'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const pool = getDbPool()

  // GET: 예/적금 목록 조회 및 계산 결과 첨부
  if (method === 'GET') {
    try {
      const [rows]: any = await pool.query('SELECT * FROM savings ORDER BY maturity_date ASC, id DESC')
      
      const dataWithCalc = rows.map((item: any) => {
        const calc = calculateSavingsMaturity({
          savings_type: item.savings_type,
          principal: item.principal,
          period_months: item.period_months,
          interest_rate: item.interest_rate,
          tax_type: item.tax_type
        })
        return {
          ...item,
          calculation: calc
        }
      })

      return { success: true, data: dataWithCalc }
    } catch (err: any) {
      await initDatabase()
      const [rows]: any = await pool.query('SELECT * FROM savings ORDER BY maturity_date ASC, id DESC')
      return { success: true, data: rows }
    }
  }

  // POST: 신규 예/적금 추가
  if (method === 'POST') {
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

    if (!bank_name || !product_name) {
      throw createError({ statusCode: 400, statusMessage: '은행명과 상품명은 필수입니다.' })
    }

    const [result]: any = await pool.query(
      `INSERT INTO savings 
      (bank_name, product_name, savings_type, principal, period_months, interest_rate, tax_type, start_date, maturity_date, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        note || ''
      ]
    )

    return { success: true, id: result.insertId }
  }
})
