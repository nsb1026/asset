/**
 * ====================================================================
 * 예금 및 적금 만기 이자 & 실수령액 계산 유틸리티
 * ====================================================================
 * - 정기예금 (DEPOSIT): 단리 계산 (원금 × 연이율% × 개월수/12)
 * - 정기적금 (SAVINGS): 월적립 단리 계산 (월납입액 × 연이율% × n(n+1)/2 / 12)
 * - 이자소득세: 일반과세(15.4%), 세금우대(9.5%), 비과세(0%)
 */

export interface SavingsCalculation {
  totalPrincipal: number       // 총 납입 원금
  grossInterest: number        // 세전 이자
  taxRate: number              // 적용 세율 (%)
  taxAmount: number            // 이자 소득세
  netInterest: number          // 세후 실수령 이자
  maturityAmount: number       // 만기 시 최종 수령액 (원금 + 세후이자)
}

export function calculateSavingsMaturity(item: {
  savings_type: 'DEPOSIT' | 'SAVINGS' | string
  principal: number
  period_months: number
  interest_rate: number
  tax_type?: 'NORMAL' | 'EXEMPT' | 'PREFERENTIAL' | string
}): SavingsCalculation {
  const type = item.savings_type || 'DEPOSIT'
  const principal = Number(item.principal) || 0
  const months = Number(item.period_months) || 12
  const rate = Number(item.interest_rate) || 0
  const taxType = item.tax_type || 'NORMAL'

  let totalPrincipal = 0
  let grossInterest = 0

  if (type === 'DEPOSIT') {
    // 1. 정기예금 이자 계산 (목돈 굴리기)
    totalPrincipal = principal
    grossInterest = principal * (rate / 100) * (months / 12)
  } else {
    // 2. 정기적금 이자 계산 (매월 적립)
    totalPrincipal = principal * months
    // 단리 적금 표준 공식: 월납입액 * (연이율/100) * n(n+1)/2 / 12
    grossInterest = principal * (rate / 100) * ((months * (months + 1)) / 2) / 12
  }

  // 3. 과세 구분별 세율 결정
  let taxRate = 0.154 // 일반과세 15.4% (소득세 14% + 지방소득세 1.4%)
  let taxRatePercent = 15.4

  if (taxType === 'EXEMPT') {
    taxRate = 0.0     // 비과세 0%
    taxRatePercent = 0
  } else if (taxType === 'PREFERENTIAL') {
    taxRate = 0.095   // 세금우대 9.5%
    taxRatePercent = 9.5
  }

  // 4. 원화 단위 절사 및 계산
  grossInterest = Math.round(grossInterest)
  const taxAmount = Math.floor(grossInterest * taxRate)
  const netInterest = grossInterest - taxAmount
  const maturityAmount = totalPrincipal + netInterest

  return {
    totalPrincipal,
    grossInterest,
    taxRate: taxRatePercent,
    taxAmount,
    netInterest,
    maturityAmount
  }
}
