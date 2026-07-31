<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">펀드 관리</h1>
        <p class="text-slate-400 text-sm mt-1">보유 펀드 검색 및 투자 원금 대비 평가 금액을 관리하세요.</p>
      </div>

      <button
        @click="openAddModal"
        class="inline-flex items-center space-x-2 btn-primary text-sm font-medium"
      >
        <Plus class="w-4 h-4" />
        <span>신규 펀드 추가</span>
      </button>
    </div>

    <!-- Portfolio Summary Banner -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="glass-card p-5">
        <span class="text-xs text-slate-400 font-semibold uppercase">총 펀드 원금</span>
        <div class="text-2xl font-bold text-white mt-1">
          ₩ {{ formatNumber(summary.totalInvestment) }}
        </div>
      </div>

      <div class="glass-card p-5">
        <span class="text-xs text-slate-400 font-semibold uppercase">총 펀드 평가금액</span>
        <div class="text-2xl font-bold text-amber-300 mt-1">
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

    <!-- Funds Table Card -->
    <div class="glass-card overflow-hidden">
      <div class="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <h3 class="font-bold text-white">보유 펀드 리스트 (총 {{ funds.length }}개)</h3>
        <span class="text-xs text-slate-400">💡 펀드명 검색을 이용하여 편리하게 선택 및 등록할 수 있습니다.</span>
      </div>

      <div v-if="loading" class="text-center py-12 text-slate-500">
        펀드 데이터를 불러오는 중...
      </div>

      <div v-else-if="funds.length === 0" class="p-12 text-center">
        <div class="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-500">
          <Coins class="w-8 h-8" />
        </div>
        <h3 class="text-lg font-bold text-white mb-1">등록된 펀드가 없습니다</h3>
        <p class="text-slate-400 text-sm mb-6">펀드 상품을 등록하고 평가 손익을 관리해 보세요.</p>
        <button @click="openAddModal" class="btn-primary text-sm inline-flex items-center space-x-2">
          <Plus class="w-4 h-4" />
          <span>첫 펀드 추가하기</span>
        </button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-900/80 text-slate-400 border-b border-slate-800/80 text-xs font-semibold uppercase">
            <tr>
              <th class="px-5 py-4">펀드명 / 코드</th>
              <th class="px-5 py-4">유형</th>
              <th class="px-5 py-4">투자 원금</th>
              <th class="px-5 py-4">현재 평가금액</th>
              <th class="px-5 py-4">기준가</th>
              <th class="px-5 py-4">평가 손익 (수익률)</th>
              <th class="px-5 py-4 text-right">관리</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr v-for="f in funds" :key="f.id" class="hover:bg-slate-900/40 transition-colors">
              <td class="px-5 py-4">
                <div class="font-bold text-white">{{ f.fund_name }}</div>
                <div class="text-xs text-slate-500 font-mono">{{ f.fund_code || '코드 미입력' }}</div>
              </td>

              <td class="px-5 py-4">
                <span class="px-2 py-1 rounded bg-amber-500/20 text-amber-300 text-xs font-semibold">
                  {{ f.fund_type }}
                </span>
              </td>

              <td class="px-5 py-4 text-slate-300 font-mono">
                ₩ {{ formatNumber(f.investment_amount) }}
              </td>

              <td class="px-5 py-4 font-mono font-bold text-white">
                ₩ {{ formatNumber(f.current_valuation) }}
              </td>

              <td class="px-5 py-4 text-slate-400 font-mono">
                {{ formatNumber(f.base_price) }}원
              </td>

              <td class="px-5 py-4 font-mono">
                <div :class="getFundProfit(f) >= 0 ? 'text-profit font-bold' : 'text-loss font-bold'">
                  {{ getFundProfit(f) >= 0 ? '+' : '' }}₩ {{ formatNumber(getFundProfit(f)) }}
                  <span class="text-xs font-semibold block">
                    ({{ getFundProfitRate(f) }}%)
                  </span>
                </div>
              </td>

              <td class="px-5 py-4 text-right">
                <div class="flex items-center justify-end space-x-1">
                  <button
                    @click="openEditModal(f)"
                    class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    @click="deleteFund(f.id)"
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

    <!-- Modal Form (Add / Edit) -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div class="glass-card w-full max-w-lg p-6 bg-slate-900 border border-slate-700 shadow-2xl relative overflow-y-auto max-h-[90vh]">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-white">{{ isEditing ? '펀드 정보 수정' : '신규 펀드 등록' }}</h3>
          <button @click="showModal = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveFund" class="space-y-4">
          <!-- Fund Search Box -->
          <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 relative">
            <label class="block text-xs font-semibold text-amber-400">🔍 펀드명 / 펀드코드 검색</label>
            <div class="flex space-x-2">
              <input
                v-model="searchQuery"
                @input="onSearchInput"
                @keydown.enter.prevent="triggerFundSearch"
                type="text"
                placeholder="예: 미래에셋, 인덱스, 글로벌"
                class="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                @click="triggerFundSearch"
                :disabled="searching"
                class="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1"
              >
                <Search class="w-4 h-4" />
                <span>{{ searching ? '검색중' : '검색' }}</span>
              </button>
            </div>

            <!-- Search Dropdown -->
            <div v-if="searchResults.length > 0" class="mt-2 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl max-h-56 overflow-y-auto">
              <div class="p-2 text-[11px] text-slate-400 border-b border-slate-800 font-medium">
                검색된 펀드 목록 (클릭하여 선택하세요):
              </div>
              <div
                v-for="item in searchResults"
                :key="item.fundCode || item.fundName"
                @click="selectSearchedFund(item)"
                class="p-3 hover:bg-amber-600/30 cursor-pointer flex items-center justify-between border-b border-slate-800/50 last:border-0 transition-colors"
              >
                <div>
                  <span class="font-bold text-white text-sm">{{ item.fundName }}</span>
                  <span class="text-xs text-slate-400 font-mono ml-2">({{ item.fundCode }})</span>
                </div>
                <span class="text-xs text-amber-400 font-bold">선택 →</span>
              </div>
            </div>

            <p v-if="searchStatus" class="text-xs mt-1 text-emerald-400 font-medium">
              {{ searchStatus }}
            </p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">펀드명 *</label>
            <input
              v-model="form.fund_name"
              type="text"
              placeholder="예: 미래에셋 글로벌인덱스 펀드"
              required
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">펀드 코드 (선택)</label>
              <input
                v-model="form.fund_code"
                type="text"
                placeholder="예: K55105B92534"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">펀드 유형</label>
              <select
                v-model="form.fund_type"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="주식형">주식형</option>
                <option value="채권형">채권형</option>
                <option value="혼합형">혼합형</option>
                <option value="MMF">MMF</option>
                <option value="해외펀드">해외펀드</option>
                <option value="ETF">ETF</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">투자 원금 (원) *</label>
              <input
                v-model.number="form.investment_amount"
                type="number"
                placeholder="0"
                required
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">현재 평가 금액 (원) *</label>
              <input
                v-model.number="form.current_valuation"
                type="number"
                placeholder="0"
                required
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500 font-mono font-bold text-amber-300"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">기준가 (선택, 기본 1,000원)</label>
            <input
              v-model.number="form.base_price"
              type="number"
              step="0.01"
              placeholder="1000"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">메모 (선택)</label>
            <textarea
              v-model="form.note"
              rows="2"
              placeholder="펀드 특징 및 메모"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500 resize-none"
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
              class="btn-primary text-sm bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600"
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
import { Plus, Coins, Search, Pencil, Trash2, X } from 'lucide-vue-next'

const funds = ref([])
const loading = ref(false)
const submitting = ref(false)
const showModal = ref(false)
const isEditing = ref(false)
const currentId = ref(null)

const searchQuery = ref('')
const searchResults = ref([])
const searching = ref(false)
const searchStatus = ref('')
let debounceTimer = null

const form = ref({
  fund_name: '',
  fund_code: '',
  fund_type: '주식형',
  investment_amount: 0,
  current_valuation: 0,
  base_price: 1000,
  note: ''
})

const summary = computed(() => {
  let totalInvestment = 0
  let totalValuation = 0

  funds.value.forEach(f => {
    const inv = Number(f.investment_amount || 0)
    const val = Number(f.current_valuation || inv)

    totalInvestment += inv
    totalValuation += val
  })

  const totalProfitLoss = totalValuation - totalInvestment
  const totalProfitRate = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0

  return { totalInvestment, totalValuation, totalProfitLoss, totalProfitRate }
})

const formatNumber = (val) => {
  if (val === undefined || val === null) return '0'
  return Math.round(val).toLocaleString()
}

const getFundProfit = (f) => {
  return (f.current_valuation || f.investment_amount) - f.investment_amount
}

const getFundProfitRate = (f) => {
  if (!f.investment_amount || f.investment_amount <= 0) return '0.00'
  const profit = getFundProfit(f)
  return ((profit / f.investment_amount) * 100).toFixed(2)
}

const loadFunds = async () => {
  loading.value = true
  try {
    const res = await $fetch('/api/funds')
    if (res.success) {
      funds.value = res.data
    }
  } catch (err) {
    console.error('Failed to load funds:', err)
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
    fund_name: '',
    fund_code: '',
    fund_type: '주식형',
    investment_amount: 0,
    current_valuation: 0,
    base_price: 1000,
    note: ''
  }
  showModal.value = true
}

const openEditModal = (f) => {
  isEditing.value = true
  currentId.value = f.id
  searchQuery.value = f.fund_name
  searchResults.value = []
  searchStatus.value = ''
  form.value = {
    fund_name: f.fund_name,
    fund_code: f.fund_code || '',
    fund_type: f.fund_type || '주식형',
    investment_amount: f.investment_amount,
    current_valuation: f.current_valuation,
    base_price: f.base_price || 1000,
    note: f.note || ''
  }
  showModal.value = true
}

const onSearchInput = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    triggerFundSearch()
  }, 300)
}

const triggerFundSearch = async () => {
  const query = searchQuery.value.trim()
  if (!query) {
    searchResults.value = []
    searchStatus.value = ''
    return
  }

  searching.value = true
  try {
    const res = await $fetch(`/api/funds/search?q=${encodeURIComponent(query)}`)
    if (res.success && res.data && res.data.length > 0) {
      searchResults.value = res.data
      searchStatus.value = `총 ${res.data.length}개의 펀드가 검색되었습니다.`
    } else {
      searchResults.value = []
      searchStatus.value = `'${query}'에 대한 펀드를 찾을 수 없습니다.`
    }
  } catch (e) {
    console.error('Fund search error:', e)
  } finally {
    searching.value = false
  }
}

const selectSearchedFund = (item) => {
  form.value.fund_name = item.fundName
  form.value.fund_code = item.fundCode
  if (item.fundType) form.value.fund_type = item.fundType
  searchResults.value = []
  searchStatus.value = `✓ '${item.fundName}' 선택 완료`
}

const saveFund = async () => {
  submitting.value = true
  try {
    if (isEditing.value && currentId.value) {
      await $fetch(`/api/funds/${currentId.value}`, { method: 'PUT', body: form.value })
    } else {
      await $fetch('/api/funds', { method: 'POST', body: form.value })
    }
    showModal.value = false
    await loadFunds()
  } catch (err) {
    alert('펀드 저장 중 오류가 발생했습니다: ' + (err.message || String(err)))
  } finally {
    submitting.value = false
  }
}

const deleteFund = async (id) => {
  if (!confirm('정말 이 펀드를 삭제하시겠습니까?')) return
  try {
    await $fetch(`/api/funds/${id}`, { method: 'DELETE' })
    await loadFunds()
  } catch (err) {
    alert('펀드 삭제 중 오류가 발생했습니다.')
  }
}

onMounted(() => {
  loadFunds()
})
</script>
