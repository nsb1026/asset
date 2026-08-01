/**
 * ====================================================================
 * 자산 스냅샷/이력 조회 및 저장 API (/api/history)
 * ====================================================================
 * - GET: 날짜순 자산 이력 목록 조회
 * - POST: 특정 날짜 자산 금액 및 전체 통장/주식/예적금/펀드/부동산 세부 항목 캡처 저장
 */
import { getDbPool, initDatabase } from '../../utils/db'
import { calculateSavingsMaturity } from '../../utils/savingsCalc'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const pool = getDbPool()

  // GET: 자산 이력 목록 조회 (날짜 오름차순)
  if (method === 'GET') {
    try {
      const [rows]: any = await pool.query('SELECT * FROM asset_history ORDER BY record_date ASC')
      const formattedRows = rows.map((row: any) => {
        let details = null
        if (row.snapshot_details) {
          try {
            details = typeof row.snapshot_details === 'string' ? JSON.parse(row.snapshot_details) : row.snapshot_details
          } catch (e) {
            details = null
          }
        }
        return { ...row, snapshot_details: details }
      })
      return { success: true, data: formattedRows }
    } catch (err: any) {
      await initDatabase()
      const [rows]: any = await pool.query('SELECT * FROM asset_history ORDER BY record_date ASC')
      const formattedRows = rows.map((row: any) => {
        let details = null
        if (row.snapshot_details) {
          try {
            details = typeof row.snapshot_details === 'string' ? JSON.parse(row.snapshot_details) : row.snapshot_details
          } catch (e) {
            details = null
          }
        }
        return { ...row, snapshot_details: details }
      })
      return { success: true, data: formattedRows }
    }
  }

  // POST: 신규 자산 이력/스냅샷 저장 (REPLACE INTO 또는 INSERT ON DUPLICATE KEY UPDATE)
  if (method === 'POST') {
    const body = await readBody(event)
    let {
      record_date,
      total_asset,
      bank_balance,
      stock_valuation,
      savings_amount,
      fund_valuation,
      real_estate_amount,
      note,
      snapshot_details
    } = body

    if (!record_date) {
      throw createError({ statusCode: 400, statusMessage: '기록 날짜는 필수입니다.' })
    }

    const recDate = String(record_date).split('T')[0]

    // snapshot_details가 명시되지 않은 경우, 현재 DB의 모든 자산 세부 항목을 자동 캡처
    let capturedDetails = snapshot_details
    if (!capturedDetails) {
      const [accounts]: any = await pool.query('SELECT * FROM accounts')
      const [stocks]: any = await pool.query('SELECT * FROM stocks')
      const [savings]: any = await pool.query('SELECT * FROM savings')
      const [funds]: any = await pool.query('SELECT * FROM funds')
      const [realEstates]: any = await pool.query('SELECT * FROM real_estates')

      const formattedSavings = savings.map((item: any) => {
        const calc = calculateSavingsMaturity({
          savings_type: item.savings_type,
          principal: item.principal,
          period_months: item.period_months,
          interest_rate: item.interest_rate,
          tax_type: item.tax_type
        })
        return { ...item, maturity_amount: calc.maturityAmount }
      })

      capturedDetails = {
        accounts,
        stocks,
        savings: formattedSavings,
        funds,
        real_estates: realEstates
      }

      // 수치 미지정 시 캡처 데이터 기반 자동 산출
      const computedBank = accounts.reduce((acc: number, item: any) => acc + Number(item.balance || 0), 0)
      const computedStock = stocks.reduce((acc: number, s: any) => acc + (Number(s.quantity || 0) * Number(s.current_price || s.avg_buy_price || 0)), 0)
      const computedSavings = formattedSavings.reduce((acc: number, s: any) => acc + Number(s.maturity_amount || 0), 0)
      const computedFund = funds.reduce((acc: number, f: any) => acc + Number(f.current_valuation || f.investment_amount || 0), 0)
      const computedRealEstate = realEstates.reduce((acc: number, re: any) => acc + Number(re.acquisition_price || 0), 0)

      if (bank_balance === undefined || bank_balance === null) bank_balance = computedBank
      if (stock_valuation === undefined || stock_valuation === null) stock_valuation = computedStock
      if (savings_amount === undefined || savings_amount === null) savings_amount = computedSavings
      if (fund_valuation === undefined || fund_valuation === null) fund_valuation = computedFund
      if (real_estate_amount === undefined || real_estate_amount === null) real_estate_amount = computedRealEstate
      if (total_asset === undefined || total_asset === null || Number(total_asset) === 0) {
        total_asset = (Number(bank_balance) || 0) + (Number(stock_valuation) || 0) + (Number(savings_amount) || 0) + (Number(fund_valuation) || 0) + (Number(real_estate_amount) || 0)
      }
    }

    const detailsJsonString = typeof capturedDetails === 'object' ? JSON.stringify(capturedDetails) : (capturedDetails || null)

    await pool.query(
      `INSERT INTO asset_history 
        (record_date, total_asset, bank_balance, stock_valuation, savings_amount, fund_valuation, real_estate_amount, note, snapshot_details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        total_asset = VALUES(total_asset),
        bank_balance = VALUES(bank_balance),
        stock_valuation = VALUES(stock_valuation),
        savings_amount = VALUES(savings_amount),
        fund_valuation = VALUES(fund_valuation),
        real_estate_amount = VALUES(real_estate_amount),
        note = VALUES(note),
        snapshot_details = VALUES(snapshot_details),
        updated_at = NOW()`,
      [
        recDate,
        Number(total_asset) || 0,
        Number(bank_balance) || 0,
        Number(stock_valuation) || 0,
        Number(savings_amount) || 0,
        Number(fund_valuation) || 0,
        Number(real_estate_amount) || 0,
        note || '',
        detailsJsonString
      ]
    )

    return { success: true, message: `'${recDate}' 자산 스냅샷 세부 내역이 성공적으로 저장되었습니다.` }
  }
})

