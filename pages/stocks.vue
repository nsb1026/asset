<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">보유 주식 관리</h1>
        <p class="text-slate-400 text-sm mt-1">보유 종목별 평가 금액 및 인터넷 실시간/최신 시세를 조회하여 관리하세요.</p>
      </div>

      <div class="flex items-center space-x-3">
        <button
          @click="syncAllStockPrices"
          :disabled="syncing"
          class="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-all border border-slate-700"
        >
          <RefreshCw :class="['w-4 h-4 text-emerald-400', syncing ? 'animate-spin' : '']" />
          <span>{{ syncing ? '시세 갱신 중...' : '전체 시세 일괄 갱신' }}</span>
        </button>

        <button
          @click="openAddModal"
          class="inline-flex items-center space-x-2 btn-primary text-sm font-medium"
        >
          <Plus class="w-4 h-4" />
          <span>보유 주식 추가</span>
        </button>
      </div>
    </div>

    <!-- Stock Portfolio Summary Banner -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="glass-card p-5">
        <span class="text-xs text-slate-400 font-semibold uppercase">총 투자 원금</span>
        <div class="text-2xl font-bold text-white mt-1">
          ₩ {{ formatNumber(summary.totalInvestment) }}
        </div>
      </div>

      <div class="glass-card p-5">
        <span class="text-xs text-slate-400 font-semibold uppercase">총 주식 평가금</span>
        <div class="text-2xl font-bold text-white mt-1">
          ₩ {{ formatNumber(summary.totalValuation) }}
        </div>
      </div>

      <div class="glass-card p-5">
        <span class="text-xs text-slate-400 font-semibold uppercase">총 평가 손익</span>
        <div
          class="text-2xl font-bold mt-1"
          :class="summary.totalProfitLoss >= 0 ? 'text-profit' : 'text-loss'"
        >
          {{ summary.totalProfitLoss >= 0 ? '+' : '' }}₩ {{ formatNumber(summary.totalProfitLoss) }}
        </div>
      </div>

      <div class="glass-card p-5">
        <span class="text-xs text-slate-400 font-semibold uppercase">총 수익률</span>
        <div
          class="text-2xl font-bold mt-1"
          :class="summary.totalProfitRate >= 0 ? 'text-profit' : 'text-loss'"
        >
          {{ summary.totalProfitRate >= 0 ? '+' : '' }}{{ summary.totalProfitRate.toFixed(2) }}%
        </div>
      </div>
    </div>

    <!-- Stock Table Card -->
    <div class="glass-card overflow-hidden">
      <div class="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <h3 class="font-bold text-white">보유 종목 리스트 (총 {{ stocks.length }}종목)</h3>
        <span class="text-xs text-slate-400">💡 종목명(카카오, 삼성 등) 또는 종목코드로 자유롭게 검색 후 등록 가능합니다.</span>
      </div>

      <div v-if="loading" class="text-center py-12 text-slate-500">
        주식 데이터를 불러오는 중...
      </div>

      <div v-else-if="stocks.length === 0" class="p-12 text-center">
        <div class="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-500">
          <TrendingUp class="w-8 h-8" />
        </div>
        <h3 class="text-lg font-bold text-white mb-1">등록된 보유 주식이 없습니다</h3>
        <p class="text-slate-400 text-sm mb-6">주식 종목명/코드를 검색하여 등록하고 현재가를 인터넷에서 확인해 보세요.</p>
        <button @click="openAddModal" class="btn-primary text-sm inline-flex items-center space-x-2">
          <Plus class="w-4 h-4" />
          <span>첫 주식 추가하기</span>
        </button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-900/80 text-slate-400 border-b border-slate-800/80 text-xs font-semibold uppercase">
            <tr>
              <th class="px-5 py-4">종목명 / 코드</th>
              <th class="px-5 py-4">보유 수량</th>
              <th class="px-5 py-4">매수 평균가</th>
              <th class="px-5 py-4">현재가</th>
              <th class="px-5 py-4">총 평가금액</th>
              <th class="px-5 py-4">평가 손익 (수익률)</th>
              <th class="px-5 py-4 text-right">관리</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr v-for="s in stocks" :key="s.id" class="hover:bg-slate-900/40 transition-colors">
              <td class="px-5 py-4">
                <div class="font-bold text-white flex items-center space-x-2">
                  <span>{{ s.stock_name }}</span>
                  <span
                    class="text-[10px] px-1.5 py-0.5 rounded font-mono"
                    :class="s.market_type === 'OVERSEAS' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'"
                  >
                    {{ s.market_type === 'OVERSEAS' ? '해외' : '국내' }}
                  </span>
                </div>
                <div class="text-xs text-slate-500 font-mono">{{ s.stock_code || '코드미입력' }}</div>
              </td>

              <td class="px-5 py-4 font-semibold text-slate-200">
                {{ formatNumber(s.quantity) }}주
              </td>

              <td class="px-5 py-4 text-slate-300 font-mono">
                ₩ {{ formatNumber(s.avg_buy_price) }}
              </td>

              <td class="px-5 py-4 font-mono font-bold text-white">
                ₩ {{ formatNumber(s.current_price) }}
              </td>

              <td class="px-5 py-4 font-bold text-white">
                ₩ {{ formatNumber(s.quantity * s.current_price) }}
              </td>

              <td class="px-5 py-4 font-mono">
                <div :class="getStockProfit(s) >= 0 ? 'text-profit font-bold' : 'text-loss font-bold'">
                  {{ getStockProfit(s) >= 0 ? '+' : '' }}₩ {{ formatNumber(getStockProfit(s)) }}
                  <span class="text-xs font-semibold block">
                    ({{ getStockProfitRate(s) }}%)
                  </span>
                </div>
              </td>

              <td class="px-5 py-4 text-right">
                <div class="flex items-center justify-end space-x-1">
                  <button
                    @click="lookupSingleStockPrice(s)"
                    title="인터넷 시세 즉시 조회"
                    class="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800"
                  >
                    <Search class="w-4 h-4" />
                  </button>
                  <button
                    @click="openEditModal(s)"
                    class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    @click="deleteStock(s.id)"
                    class="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form (Add / Edit) with Live Stock Search & Selection -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div class="glass-card w-full max-w-lg p-6 bg-slate-900 border border-slate-700 shadow-2xl relative overflow-y-auto max-h-[90vh]">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-white">{{ isEditing ? '보유 주식 수정' : '신규 주식 등록' }}</h3>
          <button @click="showModal = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveStock" class="space-y-4">
          <!-- Interactive Stock Search Box -->
          <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 relative">
            <label class="block text-xs font-semibold text-indigo-400">🔍 종목명 / 종목코드 검색 선택</label>
            <div class="flex space-x-2">
              <input
                v-model="searchQuery"
                @input="onSearchInput"
                @keydown.enter.prevent="triggerSearch"
                type="text"
                placeholder="예: 삼성전자, 카카오, SK하이닉스, TSLA, 005930"
                class="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                @click="triggerSearch"
                :disabled="searchingPrice"
                class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1"
              >
                <Search class="w-4 h-4" />
                <span>{{ searchingPrice ? '검색중' : '검색' }}</span>
              </button>
            </div>

            <!-- Search Results Dropdown List -->
            <div v-if="searchResults.length > 0" class="mt-2 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl max-h-56 overflow-y-auto">
              <div class="p-2 text-[11px] text-slate-400 border-b border-slate-800 font-medium">
                검색된 종목 목록 (클릭하여 선택하세요):
              </div>
              <div
                v-for="item in searchResults"
                :key="item.stockCode"
                @click="selectSearchedStock(item)"
                class="p-3 hover:bg-indigo-600/30 cursor-pointer flex items-center justify-between border-b border-slate-800/50 last:border-0 transition-colors"
              >
                <div>
                  <span class="font-bold text-white text-sm">{{ item.stockName }}</span>
                  <span class="text-xs text-slate-400 font-mono ml-2">({{ item.stockCode }})</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-medium">
                    {{ item.categoryName }}
                  </span>
                  <span class="text-xs text-indigo-400 font-bold hover:underline">선택 →</span>
                </div>
              </div>
            </div>

            <p v-if="searchStatus" class="text-xs mt-1" :class="searchStatusSuccess ? 'text-emerald-400 font-medium' : 'text-amber-400'">
              {{ searchStatus }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">종목명 *</label>
              <input
                v-model="form.stock_name"
                type="text"
                placeholder="예: 삼성전자, 카카오"
                required
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">종목코드</label>
              <input
                v-model="form.stock_code"
                type="text"
                placeholder="예: 005930"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">시장 구분</label>
              <select
                v-model="form.market_type"
                class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="DOMESTIC">국내주식</option>
                <option value="OVERSEAS">해외주식</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">보유 수량 *</label>
              <input
                v-model.number="form.quantity"
                type="number"
                placeholder="0"
                required
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">매수 평균가 (원) *</label>
              <input
                v-model.number="form.avg_buy_price"
                type="number"
                placeholder="0"
                required
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">현재 시장가 (원) *</label>
            <input
              v-model.number="form.current_price"
              type="number"
              placeholder="0"
              required
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono font-bold text-indigo-300"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">메모 (선택)</label>
            <textarea
              v-model="form.note"
              rows="2"
              placeholder="매수 이유 또는 특이사항"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
            ></textarea>
          </div>

          <div class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              @click="showModal = false"
              class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="btn-primary text-sm"
            >
              {{ submitting ? '저장 중...' : '저장하기' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, TrendingUp, RefreshCw, Search, Pencil, Trash2, X } from 'lucide-vue-next'

const stocks = ref([])
const loading = ref(false)
const syncing = ref(false)
const submitting = ref(false)
const showModal = ref(false)
const isEditing = ref(false)
const currentId = ref(null)

const searchQuery = ref('')
const searchResults = ref([])
const searchingPrice = ref(false)
const searchStatus = ref('')
const searchStatusSuccess = ref(false)
let searchDebounceTimer = null

const form = ref({
  stock_name: '',
  stock_code: '',
  market_type: 'DOMESTIC',
  quantity: 0,
  avg_buy_price: 0,
  current_price: 0,
  note: ''
})

const summary = computed(() => {
  let totalInvestment = 0
  let totalValuation = 0

  stocks.value.forEach(s => {
    const qty = Number(s.quantity || 0)
    const avg = Number(s.avg_buy_price || 0)
    const cur = Number(s.current_price || avg)

    totalInvestment += qty * avg
    totalValuation += qty * cur
  })

  const totalProfitLoss = totalValuation - totalInvestment
  const totalProfitRate = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0

  return { totalInvestment, totalValuation, totalProfitLoss, totalProfitRate }
})

const formatNumber = (val) => {
  if (val === undefined || val === null) return '0'
  return Math.round(val).toLocaleString()
}

const getStockProfit = (s) => {
  return (s.current_price - s.avg_buy_price) * s.quantity
}

const getStockProfitRate = (s) => {
  if (!s.avg_buy_price || s.avg_buy_price <= 0) return '0.00'
  return (((s.current_price - s.avg_buy_price) / s.avg_buy_price) * 100).toFixed(2)
}

const loadStocks = async () => {
  loading.value = true
  try {
    const res = await $fetch('/api/stocks')
    if (res.success) {
      stocks.value = res.data
    }
  } catch (err) {
    console.error('Failed to load stocks:', err)
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  isEditing.value = false
  currentId.value = null
  searchQuery.value = ''
  searchResults.value = []
  searchStatus.value = ''
  form.value = {
    stock_name: '',
    stock_code: '',
    market_type: 'DOMESTIC',
    quantity: 0,
    avg_buy_price: 0,
    current_price: 0,
    note: ''
  }
  showModal.value = true
}

const openEditModal = (s) => {
  isEditing.value = true
  currentId.value = s.id
  searchQuery.value = s.stock_name || s.stock_code
  searchResults.value = []
  searchStatus.value = ''
  form.value = {
    stock_name: s.stock_name,
    stock_code: s.stock_code || '',
    market_type: s.market_type || 'DOMESTIC',
    quantity: s.quantity,
    avg_buy_price: s.avg_buy_price,
    current_price: s.current_price,
    note: s.note || ''
  }
  showModal.value = true
}

// 실시간 입력에 따른 검색
const onSearchInput = () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    triggerSearch()
  }, 300)
}

const triggerSearch = async () => {
  const query = searchQuery.value.trim()
  if (!query) {
    searchResults.value = []
    searchStatus.value = ''
    return
  }

  searchingPrice.value = true
  searchStatus.value = ''

  try {
    // 1. 먼저 종목 검색 API 호출
    const searchRes = await $fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`)
    if (searchRes.success && searchRes.data && searchRes.data.length > 0) {
      searchResults.value = searchRes.data
      searchStatus.value = `총 ${searchRes.data.length}개의 검색 결과가 있습니다. 아래 목록에서 선택하세요.`
      searchStatusSuccess.value = true
    } else {
      searchResults.value = []
      searchStatus.value = `'${query}'에 대한 종목을 찾지 못했습니다.`
      searchStatusSuccess.value = false
    }
  } catch (err) {
    console.error('Search trigger error:', err)
  } finally {
    searchingPrice.value = false
  }
}

// 검색된 목록에서 종목 클릭 시 자동 완성 및 현재가 조회
const selectSearchedStock = async (item) => {
  form.value.stock_name = item.stockName
  form.value.stock_code = item.stockCode
  form.value.market_type = item.marketType
  searchResults.value = []

  searchingPrice.value = true
  searchStatus.value = `'${item.stockName}' 시세 조회 중...`

  try {
    const priceRes = await $fetch(`/api/stocks/fetch-price?code=${encodeURIComponent(item.stockCode || item.stockName)}`)
    if (priceRes.success && priceRes.currentPrice > 0) {
      form.value.current_price = priceRes.currentPrice
      searchStatus.value = `✓ '${item.stockName}(${item.stockCode})' 선택 완료! 현재가 ₩ ${priceRes.currentPrice.toLocaleString()} 자동 입력`
      searchStatusSuccess.value = true
    } else {
      searchStatus.value = `✓ '${item.stockName}' 선택 완료 (현재가는 수동 입력하세요)`
      searchStatusSuccess.value = true
    }
  } catch (err) {
    searchStatus.value = `✓ '${item.stockName}' 선택 완료`
    searchStatusSuccess.value = true
  } finally {
    searchingPrice.value = false
  }
}

const lookupSingleStockPrice = async (stockItem) => {
  const code = stockItem.stock_code || stockItem.stock_name
  try {
    const res = await $fetch(`/api/stocks/fetch-price?code=${encodeURIComponent(code)}`)
    if (res.success && res.currentPrice > 0) {
      await $fetch(`/api/stocks/${stockItem.id}`, {
        method: 'PUT',
        body: {
          ...stockItem,
          current_price: res.currentPrice
        }
      })
      await loadStocks()
      alert(`'${stockItem.stock_name}' 현재가 갱신 완료: ₩ ${res.currentPrice.toLocaleString()}`)
    } else {
      alert(res.message || '시세 정보를 찾을 수 없습니다.')
    }
  } catch (err) {
    alert('시세 조회 실패: ' + err.message)
  }
}

const syncAllStockPrices = async () => {
  if (stocks.value.length === 0) return
  syncing.value = true

  let updatedCount = 0
  for (const s of stocks.value) {
    const code = s.stock_code || s.stock_name
    if (!code) continue

    try {
      const res = await $fetch(`/api/stocks/fetch-price?code=${encodeURIComponent(code)}`)
      if (res.success && res.currentPrice > 0) {
        await $fetch(`/api/stocks/${s.id}`, {
          method: 'PUT',
          body: {
            ...s,
            current_price: res.currentPrice
          }
        })
        updatedCount++
      }
    } catch (e) {
      console.warn(`Failed to sync price for ${s.stock_name}`, e)
    }
  }

  await loadStocks()
  syncing.value = false
  alert(`총 ${updatedCount}개 종목의 최신 인터넷 시세를 성공적으로 갱신하였습니다.`)
}

const saveStock = async () => {
  submitting.value = true
  try {
    if (isEditing.value && currentId.value) {
      await $fetch(`/api/stocks/${currentId.value}`, { method: 'PUT', body: form.value })
    } else {
      await $fetch('/api/stocks', { method: 'POST', body: form.value })
    }
    showModal.value = false
    await loadStocks()
  } catch (err) {
    alert('주식 저장 중 오류가 발생했습니다: ' + (err.message || String(err)))
  } finally {
    submitting.value = false
  }
}

const deleteStock = async (id) => {
  if (!confirm('정말 이 주식을 삭제하시겠습니까?')) return
  try {
    await $fetch(`/api/stocks/${id}`, { method: 'DELETE' })
    await loadStocks()
  } catch (err) {
    alert('주식 삭제 중 오류가 발생했습니다.')
  }
}

onMounted(() => {
  loadStocks()
})
</script>
