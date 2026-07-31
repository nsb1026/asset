/**
 * ====================================================================
 * 가계부 월별 및 년별 수입/지출 추이 집계 API (/api/ledger/stats)
 * ====================================================================
 * - 월별 통계: DATE_FORMAT(entry_date, '%Y-%m') 기준 수입/지출/순수익 집계
 * - 년별 통계: DATE_FORMAT(entry_date, '%Y') 기준 수입/지출/순수익 집계
 * - 카테고리별 지출 분포 집계
 */
import { getDbPool, initDatabase } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const pool = getDbPool()

  try {
    // 1. 월별 수입 및 지출 집계 (DATE_FORMAT(entry_date, '%Y-%m'))
    const [monthlyRows]: any = await pool.query(`
      SELECT 
        DATE_FORMAT(entry_date, '%Y-%m') AS ym,
        SUM(CASE WHEN entry_type = 'INCOME' THEN amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN entry_type = 'EXPENSE' THEN amount ELSE 0 END) AS total_expense
      FROM ledger_entries
      GROUP BY ym
      ORDER BY ym ASC
    `)

    const monthlyTrends = monthlyRows.map((row: any) => ({
      month: row.ym,
      income: Number(row.total_income || 0),
      expense: Number(row.total_expense || 0),
      net: Number(row.total_income || 0) - Number(row.total_expense || 0)
    }))

    // 2. 년별 수입 및 지출 집계 (DATE_FORMAT(entry_date, '%Y'))
    const [yearlyRows]: any = await pool.query(`
      SELECT 
        DATE_FORMAT(entry_date, '%Y') AS yr,
        SUM(CASE WHEN entry_type = 'INCOME' THEN amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN entry_type = 'EXPENSE' THEN amount ELSE 0 END) AS total_expense
      FROM ledger_entries
      GROUP BY yr
      ORDER BY yr ASC
    `)

    const yearlyTrends = yearlyRows.map((row: any) => ({
      year: row.yr,
      income: Number(row.total_income || 0),
      expense: Number(row.total_expense || 0),
      net: Number(row.total_income || 0) - Number(row.total_expense || 0)
    }))

    // 3. 지출 카테고리별 집계
    const [categoryRows]: any = await pool.query(`
      SELECT 
        category,
        SUM(amount) AS total_amount
      FROM ledger_entries
      WHERE entry_type = 'EXPENSE'
      GROUP BY category
      ORDER BY total_amount DESC
    `)

    const categoryStats = categoryRows.map((row: any) => ({
      category: row.category,
      amount: Number(row.total_amount || 0)
    }))

    // 4. 전체 총 수입, 총 지출, 총 순수익
    const totalIncome = monthlyTrends.reduce((sum: number, m: any) => sum + m.income, 0)
    const totalExpense = monthlyTrends.reduce((sum: number, m: any) => sum + m.expense, 0)

    return {
      success: true,
      summary: {
        totalIncome,
        totalExpense,
        netSavings: totalIncome - totalExpense
      },
      monthlyTrends,
      yearlyTrends,
      categoryStats
    }
  } catch (err: any) {
    await initDatabase()
    return {
      success: true,
      summary: { totalIncome: 0, totalExpense: 0, netSavings: 0 },
      monthlyTrends: [],
      yearlyTrends: [],
      categoryStats: []
    }
  }
})
