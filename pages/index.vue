<template>
  <div class="space-y-8">
    <!-- 대시보드 페이지 상단 타이틀 -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">자산 종합 대시보드</h1>
        <p class="text-slate-400 text-sm mt-1">은행 통장, 보유 주식, 예/적금, 펀드 및 부동산 자산을 한눈에 파악하세요.</p>
      </div>

      <div class="flex items-center space-x-3">
        <!-- 현재 자산 스냅샷 빠른 기록 버튼 -->
        <button
          @click="saveQuickSnapshot"
          class="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-600/30"
        >
          <Camera class="w-4 h-4" />
          <span>오늘 자산 스냅샷 저장</span>
        </button>

        <!-- 데이터 수동 새로고침 버튼 -->
        <button
          @click="loadDashboardData"
          :disabled="loading"
          class="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-all border border-slate-700"
        >
          <RefreshCw :class="['w-4 h-4 text-indigo-400', loading ? 'animate-spin' : '']" />
          <span>새로고침</span>
        </button>
      </div>
    </div>

    <!-- DB 연결 오류 안내 메시지 (오류 발생 시에만 노출) -->
    <div v-if="dbError" class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
      <span>⚠️ MariaDB 연결 오류: {{ dbError }}</span>
      <button @click="initDb" class="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-500">
        DB 다시 초기화
      </button>
    </div>

    <!-- 5대 자산군 주요 지표 요약 카드 섹션 -->
    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <!-- 1. 총 평가 자산 카드 -->
      <div class="glass-card glass-card-hover p-5 relative overflow-hidden md:col-span-3 lg:col-span-1 bg-gradient-to-br from-slate-900 to-indigo-950/50 border-indigo-500/30">
        <div class="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
          <span>총 자산</span>
          <div class="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Wallet class="w-4 h-4" />
          </div>
        </div>
        <div class="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          ₩ {{ formatNumber(summary.totalAssetValue) }}
        </div>
        <p class="text-[11px] text-slate-400 mt-2">
          모든 카테고리 포함
        </p>
      </div>

      <!-- 2. 은행 통장 잔액 카드 -->
      <div class="glass-card glass-card-hover p-5">
        <div class="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
          <span>은행 통장 잔액</span>
          <div class="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Building2 class="w-4 h-4" />
          </div>
        </div>
        <div class="text-xl sm:text-2xl font-extrabold text-cyan-300 tracking-tight">
          ₩ {{ formatNumber(summary.totalBankBalance) }}
        </div>
        <p class="text-[11px] text-slate-400 mt-2">
          계좌 {{ counts.accountCount }}개
        </p>
      </div>

      <!-- 3. 보유 주식 평가금 카드 -->
      <div class="glass-card glass-card-hover p-5">
        <div class="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
          <span>주식 평가금</span>
          <div class="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <TrendingUp class="w-4 h-4" />
          </div>
        </div>
        <div class="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          ₩ {{ formatNumber(summary.totalStockValuation) }}
        </div>
        <div class="flex items-center space-x-1 mt-2 text-[11px] font-semibold">
          <span :class="summary.totalStockProfitLoss >= 0 ? 'text-profit' : 'text-loss'">
            {{ summary.totalStockProfitLoss >= 0 ? '▲' : '▼' }} 
            ₩ {{ formatNumber(Math.abs(summary.totalStockProfitLoss)) }}
            ({{ summary.totalStockProfitRate >= 0 ? '+' : '' }}{{ summary.totalStockProfitRate.toFixed(2) }}%)
          </span>
        </div>
      </div>

      <!-- 4. 예/적금 만기 수령액 카드 -->
      <div class="glass-card glass-card-hover p-5">
        <div class="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
          <span>예/적금 만기액</span>
          <div class="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
            <PiggyBank class="w-4 h-4" />
          </div>
        </div>
        <div class="text-xl sm:text-2xl font-extrabold text-purple-300 tracking-tight">
          ₩ {{ formatNumber(summary.totalSavingsMaturityAmount) }}
        </div>
        <p class="text-[11px] text-slate-400 mt-2">
          세후 이자: <span class="text-purple-300 font-semibold">+₩ {{ formatNumber(summary.totalSavingsNetInterest) }}</span>
        </p>
      </div>

      <!-- 5. 펀드 평가금액 카드 -->
      <div class="glass-card glass-card-hover p-5">
        <div class="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
          <span>펀드 평가금</span>
          <div class="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <Coins class="w-4 h-4" />
          </div>
        </div>
        <div class="text-xl sm:text-2xl font-extrabold text-amber-300 tracking-tight">
          ₩ {{ formatNumber(summary.totalFundValuation) }}
        </div>
        <p class="text-[11px] text-slate-400 mt-2">
          보유 펀드 {{ counts.fundCount }}개
        </p>
      </div>

      <!-- 6. 부동산 취득자산 카드 -->
      <div class="glass-card glass-card-hover p-5 md:col-span-3 lg:col-span-1">
        <div class="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
          <span>부동산 취득자산</span>
          <div class="p-1.5 rounded-lg bg-teal-500/20 text-teal-400">
            <Home class="w-4 h-4" />
          </div>
        </div>
        <div class="text-xl sm:text-2xl font-extrabold text-teal-300 tracking-tight">
          ₩ {{ formatNumber(summary.totalRealEstateAcquisition) }}
        </div>
        <p class="text-[11px] text-slate-400 mt-2">
          보유 부동산 {{ counts.realEstateCount }}개 (취득금액 기준)
        </p>
      </div>
    </div>

    <!-- 신규: 날짜별 총 자산 변동 추이 선 그래프 (Line Chart) -->
    <div class="glass-card p-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 class="text-lg font-bold text-white flex items-center space-x-2">
            <LineChart class="w-5 h-5 text-indigo-400" />
            <span>총 자산 성장의 변동 추이 그래프 (Asset Trend Line)</span>
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">원하는 날짜별로 수동/자동 기록된 총 자산 금액의 변화 추세를 한눈에 파악하세요.</p>
        </div>

        <NuxtLink to="/ledger" class="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
          자산 추이 & 가계부 전체보기 →
        </NuxtLink>
      </div>

      <div class="h-64 w-full relative">
        <Line v-if="assetChartReady" :data="assetLineChartData" :options="lineChartOptions" />
        <div v-else class="flex items-center justify-center h-full text-slate-500 text-xs">
          저장된 자산 이력 데이터가 없습니다. [오늘 자산 스냅샷 저장] 버튼을 누르면 기록이 추가됩니다.
        </div>
      </div>
    </div>

    <!-- 차트 및 상세 요약 리스트 영역 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 5분할 자산 구성 비율 도넛 차트 -->
      <div class="glass-card p-6 lg:col-span-1 flex flex-col justify-between">
        <div>
          <h3 class="text-lg font-bold text-white mb-1">자산 비중 분포</h3>
          <p class="text-xs text-slate-400 mb-6">전체 자산 카테고리별 비율</p>
        </div>

        <div class="relative flex items-center justify-center my-4">
          <div class="w-52 h-52 relative">
            <Doughnut v-if="chartDataReady" :data="doughnutChartData" :options="chartOptions" />
            <div v-else class="flex items-center justify-center h-full text-slate-500 text-xs">
              데이터 준비 중...
            </div>
          </div>
        </div>

        <!-- 범례 및 비율 목록 -->
        <div class="space-y-2.5 mt-4 text-xs font-medium border-t border-slate-800/80 pt-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="w-3 h-3 rounded-full bg-cyan-500"></span>
              <span class="text-slate-300">은행 잔액</span>
            </div>
            <span class="text-white font-semibold">{{ getAssetPercent(summary.totalBankBalance) }}%</span>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span class="text-slate-300">주식 평가금</span>
            </div>
            <span class="text-white font-semibold">{{ getAssetPercent(summary.totalStockValuation) }}%</span>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="w-3 h-3 rounded-full bg-purple-500"></span>
              <span class="text-slate-300">예/적금 만기액</span>
            </div>
            <span class="text-white font-semibold">{{ getAssetPercent(summary.totalSavingsMaturityAmount) }}%</span>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="w-3 h-3 rounded-full bg-amber-500"></span>
              <span class="text-slate-300">펀드 평가금</span>
            </div>
            <span class="text-white font-semibold">{{ getAssetPercent(summary.totalFundValuation) }}%</span>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="w-3 h-3 rounded-full bg-teal-500"></span>
              <span class="text-slate-300">부동산 취득자산</span>
            </div>
            <span class="text-white font-semibold">{{ getAssetPercent(summary.totalRealEstateAcquisition) }}%</span>
          </div>
        </div>
      </div>

      <!-- 세부 서브 요약 카드 리스트 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 은행별 잔액 요약 카드 -->
        <div class="glass-card p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-bold text-white">은행별 잔액 요약</h3>
              <p class="text-xs text-slate-400">등록된 금융기관별 잔액 현황</p>
            </div>
            <NuxtLink to="/accounts" class="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
              전체보기 →
            </NuxtLink>
          </div>

          <div v-if="bankBreakdown.length === 0" class="text-center py-8 text-slate-500 text-sm">
            등록된 계좌가 없습니다. [은행 통장 관리]에서 계좌를 추가해 보세요.
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              v-for="item in bankBreakdown"
              :key="item.bank"
              class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between"
            >
              <div class="flex items-center space-x-2.5">
                <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400 font-bold text-xs">
                  {{ item.bank.substring(0, 2) }}
                </div>
                <span class="font-semibold text-slate-200 text-xs">{{ item.bank }}</span>
              </div>
              <div class="text-right">
                <div class="font-bold text-white text-xs">₩ {{ formatNumber(item.balance) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 펀드 및 부동산 요약 카드 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 펀드 자산 요약 -->
          <div class="glass-card p-5">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-bold text-white text-sm flex items-center space-x-2">
                <Coins class="w-4 h-4 text-amber-400" />
                <span>펀드 자산 요약</span>
              </h4>
              <NuxtLink to="/funds" class="text-xs text-amber-400 hover:underline">
                관리 →
              </NuxtLink>
            </div>
            <div v-if="fundsList.length === 0" class="text-xs text-slate-500 py-4 text-center">
              등록된 펀드가 없습니다.
            </div>
            <div v-else class="space-y-2">
              <div v-for="f in fundsList.slice(0, 3)" :key="f.id" class="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-900/50">
                <span class="text-slate-200 font-medium truncate max-w-[140px]">{{ f.fund_name }}</span>
                <span class="font-bold text-amber-300">₩ {{ formatNumber(f.current_valuation || f.investment_amount) }}</span>
              </div>
            </div>
          </div>

          <!-- 부동산 자산 요약 -->
          <div class="glass-card p-5">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-bold text-white text-sm flex items-center space-x-2">
                <Home class="w-4 h-4 text-teal-400" />
                <span>부동산 자산 요약</span>
              </h4>
              <NuxtLink to="/real-estate" class="text-xs text-teal-400 hover:underline">
                관리 →
              </NuxtLink>
            </div>
            <div v-if="realEstatesList.length === 0" class="text-xs text-slate-500 py-4 text-center">
              등록된 부동산이 없습니다.
            </div>
            <div v-else class="space-y-2">
              <div v-for="re in realEstatesList.slice(0, 3)" :key="re.id" class="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-900/50">
                <span class="text-slate-200 font-medium truncate max-w-[140px]">{{ re.property_name }}</span>
                <span class="font-bold text-teal-300">₩ {{ formatNumber(re.acquisition_price) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 대시보드 메인 컴포넌트
 * - 백엔드 API(/api/dashboard 및 /api/history)를 호출하여 5대 자산군 통계 지표 및 총 자산 추이 그래프를 생성합니다.
 */
import { ref, computed, onMounted } from 'vue'
import { Wallet, Building2, TrendingUp, PiggyBank, Coins, Home, LineChart, Camera, RefreshCw } from 'lucide-vue-next'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Doughnut, Line } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler)

// 상태 데이터 반응형 변수 정의
const loading = ref(false)
const dbError = ref('')
const summary = ref({
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
})
const counts = ref({ accountCount: 0, stockCount: 0, savingsCount: 0, fundCount: 0, realEstateCount: 0 })
const bankBreakdown = ref([])
const stocksList = ref([])
const fundsList = ref([])
const realEstatesList = ref([])
const chartDataReady = ref(false)

// 날짜별 총 자산 추이 이력 데이터
const assetHistory = ref([])

// 원화 포맷 헬퍼 함수
const formatNumber = (val) => {
  if (val === undefined || val === null) return '0'
  return Math.round(val).toLocaleString()
}

// 자산별 비중(%) 계산 헬퍼 함수
const getAssetPercent = (val) => {
  if (!summary.value.totalAssetValue || summary.value.totalAssetValue <= 0) return 0
  return ((val / summary.value.totalAssetValue) * 100).toFixed(1)
}

// 1. 총 자산 추이 선 그래프 (Line Chart) 데이터
const assetChartReady = computed(() => assetHistory.value.length > 0)

const assetLineChartData = computed(() => {
  const labels = assetHistory.value.map(h => String(h.record_date).split('T')[0])
  const data = assetHistory.value.map(h => h.total_asset)

  return {
    labels,
    datasets: [
      {
        label: '총 자산 금액',
        data,
        borderColor: '#818cf8',
        backgroundColor: 'rgba(129, 140, 248, 0.15)',
        borderWidth: 3,
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#6366f1',
        pointRadius: 4
      }
    ]
  }
})

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => ` 총 자산: ₩ ${Number(context.raw).toLocaleString()}`
      }
    }
  },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', callback: (v) => `₩ ${(v/10000).toLocaleString()}만` } }
  }
}

// 2. 5분할 자산 도넛 차트 데이터
const doughnutChartData = computed(() => {
  return {
    labels: ['은행 잔액', '주식 평가금', '예/적금 만기액', '펀드 평가금', '부동산 취득자산'],
    datasets: [
      {
        data: [
          summary.value.totalBankBalance || 0,
          summary.value.totalStockValuation || 0,
          summary.value.totalSavingsMaturityAmount || 0,
          summary.value.totalFundValuation || 0,
          summary.value.totalRealEstateAcquisition || 0
        ],
        backgroundColor: ['#06b6d4', '#10b981', '#a855f7', '#f59e0b', '#14b8a6'],
        borderWidth: 0,
        hoverOffset: 6
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => {
          const val = context.raw || 0
          return ` ₩ ${val.toLocaleString()}`
        }
      }
    }
  },
  cutout: '72%'
}

// DB 초기화 함수
const initDb = async () => {
  try {
    const res = await $fetch('/api/init')
    if (!res.success) {
      dbError.value = res.message || 'DB 연결 오류'
    } else {
      dbError.value = ''
      await loadDashboardData()
    }
  } catch (err) {
    dbError.value = err.message
  }
}

// 자산 추이 이력 불러오기
const loadAssetHistory = async () => {
  try {
    const res = await $fetch('/api/history')
    if (res.success) {
      assetHistory.value = res.data
    }
  } catch (err) {
    console.error('자산 이력 불러오기 실패:', err)
  }
}

// 오늘 날짜 자산 스냅샷 빠른 저장
const saveQuickSnapshot = async () => {
  const today = new Date().toISOString().split('T')[0]
  try {
    const res = await $fetch('/api/history', {
      method: 'POST',
      body: {
        record_date: today,
        total_asset: summary.value.totalAssetValue,
        bank_balance: summary.value.totalBankBalance,
        stock_valuation: summary.value.totalStockValuation,
        savings_amount: summary.value.totalSavingsMaturityAmount,
        fund_valuation: summary.value.totalFundValuation,
        real_estate_amount: summary.value.totalRealEstateAcquisition,
        note: '대시보드 퀵 스냅샷 저장'
      }
    })
    alert(res.message || '오늘의 자산 스냅샷이 저장되었습니다.')
    await loadAssetHistory()
  } catch (err) {
    alert('스냅샷 저장 실패: ' + err.message)
  }
}

// 대시보드 집계 데이터 호출 함수
const loadDashboardData = async () => {
  loading.value = true
  try {
    const res = await $fetch('/api/dashboard')
    if (res.success) {
      summary.value = res.summary
      counts.value = res.counts
      bankBreakdown.value = res.bankBreakdown
      stocksList.value = res.stocksList
      fundsList.value = res.fundsList
      realEstatesList.value = res.realEstatesList
      chartDataReady.value = true
    }
  } catch (err) {
    console.error('대시보드 데이터 조회 실패:', err)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await initDb()
  await loadAssetHistory()
})
</script>
