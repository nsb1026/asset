/**
 * ====================================================================
 * 대시보드 종합 요약 데이터 조회 API (/api/dashboard)
 * ====================================================================
 * - 전체 자산 합계 (통장 잔액 + 주식 평가금 + 예적금 만기액 + 펀드 평가금 + 부동산 취득금)
 * - 은행별 잔액 분포
 * - 주식 / 펀드 / 예적금 / 부동산 리스트 및 통계 반환
 */
import { getDbPool, initDatabase } from '../utils/db'
import { calculateSavingsMaturity } from '../utils/savingsCalc'

export default defineEventHandler(async (event) => {
  const pool = getDbPool()

  try {
    // 1. 은행 계좌 정보 및 은행별 잔액 집계
    const [accounts]: any = await pool.query('SELECT * FROM accounts')
    const totalBankBalance = accounts.reduce((acc: number, item: any) => acc + Number(item.balance || 0), 0)

    const bankMap: Record<string, number> = {}
    accounts.forEach((acc: any) => {
      const bank = acc.bank_name || '기타'
      bankMap[bank] = (bankMap[bank] || 0) + Number(acc.balance || 0)
    })
    const bankBreakdown = Object.entries(bankMap).map(([bank, balance]) => ({ bank, balance }))

    // 2. 보유 주식 정보 및 평가 금액/손익 집계
    const [stocks]: any = await pool.query('SELECT * FROM stocks')
    let totalStockInvestment = 0
    let totalStockValuation = 0

    stocks.forEach((s: any) => {
      const qty = Number(s.quantity || 0)
      const avgPrice = Number(s.avg_buy_price || 0)
      const curPrice = Number(s.current_price || avgPrice)
      
      totalStockInvestment += qty * avgPrice
      totalStockValuation += qty * curPrice
    })

    const totalStockProfitLoss = totalStockValuation - totalStockInvestment
    const totalStockProfitRate = totalStockInvestment > 0 ? (totalStockProfitLoss / totalStockInvestment) * 100 : 0

    // 3. 예/적금 정보 및 만기 수령액 집계
    const [savings]: any = await pool.query('SELECT * FROM savings')
    let totalSavingsPrincipal = 0
    let totalSavingsMaturityAmount = 0
    let totalSavingsNetInterest = 0

    savings.forEach((item: any) => {
      const calc = calculateSavingsMaturity({
        savings_type: item.savings_type,
        principal: item.principal,
        period_months: item.period_months,
        interest_rate: item.interest_rate,
        tax_type: item.tax_type
      })
      totalSavingsPrincipal += calc.totalPrincipal
      totalSavingsMaturityAmount += calc.maturityAmount
      totalSavingsNetInterest += calc.netInterest
    })

    // 4. 펀드 정보 및 평가 금액 집계
    const [funds]: any = await pool.query('SELECT * FROM funds')
    let totalFundInvestment = 0
    let totalFundValuation = 0

    funds.forEach((f: any) => {
      const inv = Number(f.investment_amount || 0)
      const val = Number(f.current_valuation || inv)
      totalFundInvestment += inv
      totalFundValuation += val
    })
    const totalFundProfitLoss = totalFundValuation - totalFundInvestment
    const totalFundProfitRate = totalFundInvestment > 0 ? (totalFundProfitLoss / totalFundInvestment) * 100 : 0

    // 5. 부동산 정보 (취득 금액 기준)
    const [realEstates]: any = await pool.query('SELECT * FROM real_estates')
    const totalRealEstateAcquisition = realEstates.reduce((acc: number, item: any) => acc + Number(item.acquisition_price || 0), 0)

    // 6. 전체 자산 종합 합계 (5대 자산군 포함)
    const totalAssetValue = totalBankBalance + totalStockValuation + totalSavingsMaturityAmount + totalFundValuation + totalRealEstateAcquisition

    return {
      success: true,
      summary: {
        totalAssetValue,
        totalBankBalance,
        totalStockValuation,
        totalStockInvestment,
        totalStockProfitLoss,
        totalStockProfitRate,
        totalSavingsMaturityAmount,
        totalSavingsPrincipal,
        totalSavingsNetInterest,
        totalFundValuation,
        totalFundInvestment,
        totalFundProfitLoss,
        totalFundProfitRate,
        totalRealEstateAcquisition
      },
      counts: {
        accountCount: accounts.length,
        stockCount: stocks.length,
        savingsCount: savings.length,
        fundCount: funds.length,
        realEstateCount: realEstates.length
      },
      bankBreakdown,
      stocksList: stocks,
      savingsList: savings,
      fundsList: funds,
      realEstatesList: realEstates
    }
  } catch (err: any) {
    // DB 미초기화 시 자동 생성 실행
    await initDatabase()
    return {
      success: true,
      summary: {
        totalAssetValue: 0,
        totalBankBalance: 0,
        totalStockValuation: 0,
        totalStockInvestment: 0,
        totalStockProfitLoss: 0,
        totalStockProfitRate: 0,
        totalSavingsMaturityAmount: 0,
        totalSavingsPrincipal: 0,
        totalSavingsNetInterest: 0,
        totalFundValuation: 0,
        totalFundInvestment: 0,
        totalFundProfitLoss: 0,
        totalFundProfitRate: 0,
        totalRealEstateAcquisition: 0
      },
      counts: { accountCount: 0, stockCount: 0, savingsCount: 0, fundCount: 0, realEstateCount: 0 },
      bankBreakdown: [],
      stocksList: [],
      savingsList: [],
      fundsList: [],
      realEstatesList: []
    }
  }
})
