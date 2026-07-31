<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">예금 & 적금 관리</h1>
        <p class="text-slate-400 text-sm mt-1">이율과 과세 옵션을 입력하여 만기 시 수령할 총 금액과 세후 이자를 계산하세요.</p>
      </div>

      <button
        @click="openAddModal"
        class="inline-flex items-center space-x-2 btn-primary text-sm font-medium"
      >
        <Plus class="w-4 h-4" />
        <span>예/적금 추가</span>
      </button>
    </div>

    <!-- Summary Banner -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div class="glass-card p-6 relative overflow-hidden">
        <span class="text-xs text-slate-400 font-semibold uppercase">총 예/적금 원금</span>
        <div class="text-3xl font-extrabold text-white mt-1">
          ₩ {{ formatNumber(summary.totalPrincipal) }}
        </div>
        <p class="text-xs text-slate-400 mt-2">보유 중인 상품 {{ savingsList.length }}개</p>
      </div>

      <div class="glass-card p-6 relative overflow-hidden">
        <span class="text-xs text-slate-400 font-semibold uppercase">예상 세후 총 이자</span>
        <div class="text-3xl font-extrabold text-emerald-400 mt-1">
          +₩ {{ formatNumber(summary.totalNetInterest) }}
        </div>
        <p class="text-xs text-slate-400 mt-2">세전 이자 ₩ {{ formatNumber(summary.totalGrossInterest) }}</p>
      </div>

      <div class="glass-card p-6 relative overflow-hidden bg-gradient-to-br from-slate-900 to-purple-950/40">
        <span class="text-xs text-purple-300 font-semibold uppercase">만기시 총 수령 예상 금액</span>
        <div class="text-3xl font-extrabold text-purple-300 mt-1">
          ₩ {{ formatNumber(summary.totalMaturityAmount) }}
        </div>
        <p class="text-xs text-purple-400/80 mt-2">원금 + 세후 이자 합계</p>
      </div>
    </div>

    <!-- Savings & Deposit List -->
    <div v-if="loading" class="text-center py-12 text-slate-500">
      예/적금 목록을 불러오는 중...
    </div>

    <div v-else-if="savingsList.length === 0" class="glass-card p-12 text-center">
      <div class="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-500">
        <PiggyBank class="w-8 h-8" />
      </div>
      <h3 class="text-lg font-bold text-white mb-1">등록된 예금/적금이 없습니다</h3>
      <p class="text-slate-400 text-sm mb-6">예금 또는 적금을 추가하고 만기 이자 및 수령액을 자동 계산해 보세요.</p>
      <button @click="openAddModal" class="btn-primary text-sm inline-flex items-center space-x-2">
        <Plus class="w-4 h-4" />
        <span>첫 예/적금 등록하기</span>
      </button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div
        v-for="item in savingsList"
        :key="item.id"
        class="glass-card glass-card-hover p-6 flex flex-col justify-between"
      >
        <div>
          <!-- Header info -->
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <span
                class="px-2.5 py-1 rounded-md text-xs font-bold"
                :class="item.savings_type === 'SAVINGS' ? 'bg-amber-500/20 text-amber-300' : 'bg-purple-500/20 text-purple-300'"
              >
                {{ item.savings_type === 'SAVINGS' ? '정기적금' : '정기예금' }}
              </span>
              <span class="text-xs font-semibold text-slate-400">{{ item.bank_name }}</span>
            </div>

            <div class="flex items-center space-x-1">
              <button @click="openEditModal(item)" class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                <Pencil class="w-4 h-4" />
              </button>
              <button @click="deleteSavings(item.id)" class="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <h3 class="text-xl font-bold text-white mb-2">{{ item.product_name }}</h3>

          <!-- Details Grid -->
          <div class="grid grid-cols-2 gap-3 text-xs bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 mb-4">
            <div>
              <span class="text-slate-400 block mb-0.5">
                {{ item.savings_type === 'SAVINGS' ? '월 적립액' : '예금 원금' }}
              </span>
              <span class="font-bold text-white text-sm">₩ {{ formatNumber(item.principal) }}</span>
            </div>

            <div>
              <span class="text-slate-400 block mb-0.5">연 이율 (%)</span>
              <span class="font-bold text-emerald-400 text-sm">{{ item.interest_rate }}%</span>
            </div>

            <div>
              <span class="text-slate-400 block mb-0.5">가입 기간</span>
              <span class="font-semibold text-slate-200">{{ item.period_months }}개월</span>
            </div>

            <div>
              <span class="text-slate-400 block mb-0.5">과세 구분</span>
              <span class="font-semibold text-slate-200">
                {{ getTaxLabel(item.tax_type) }}
              </span>
            </div>
          </div>

          <!-- Maturity Progress Bar -->
          <div v-if="item.start_date && item.maturity_date" class="mb-4">
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="text-slate-400">만기 진행률</span>
              <span class="font-semibold text-indigo-400">
                {{ getDDayText(item.maturity_date) }} ({{ getProgressPercent(item.start_date, item.maturity_date) }}%)
              </span>
            </div>
            <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                class="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                :style="{ width: `${getProgressPercent(item.start_date, item.maturity_date)}%` }"
              ></div>
            </div>
            <div class="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
              <span>{{ item.start_date }}</span>
              <span>{{ item.maturity_date }} (만기)</span>
            </div>
          </div>
        </div>

        <!-- Maturity Calculation Summary -->
        <div class="border-t border-slate-800/80 pt-4 space-y-1 text-xs">
          <div class="flex justify-between text-slate-400">
            <span>총 만기 원금:</span>
            <span class="text-slate-200 font-semibold">₩ {{ formatNumber(item.calculation?.totalPrincipal) }}</span>
          </div>

          <div class="flex justify-between text-slate-400">
            <span>세전 이자:</span>
            <span class="text-slate-200">₩ {{ formatNumber(item.calculation?.grossInterest) }}</span>
          </div>

          <div class="flex justify-between text-slate-400">
            <span>이자 소득세 ({{ item.calculation?.taxRate }}%):</span>
            <span class="text-rose-400">-₩ {{ formatNumber(item.calculation?.taxAmount) }}</span>
          </div>

          <div class="flex justify-between text-slate-400 font-medium">
            <span>세후 이자 수익:</span>
            <span class="text-emerald-400 font-bold">+₩ {{ formatNumber(item.calculation?.netInterest) }}</span>
          </div>

          <div class="flex justify-between items-center text-sm pt-2 border-t border-slate-800">
            <span class="font-bold text-white">만기시 최종 수령액:</span>
            <span class="font-extrabold text-purple-300 text-lg">
              ₩ {{ formatNumber(item.calculation?.maturityAmount) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Form (Add / Edit) -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div class="glass-card w-full max-w-lg p-6 bg-slate-900 border border-slate-700 shadow-2xl relative overflow-y-auto max-h-[90vh]">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-white">{{ isEditing ? '예/적금 정보 수정' : '신규 예금/적금 등록' }}</h3>
          <button @click="showModal = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveSavings" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">상품 종류 *</label>
              <select
                v-model="form.savings_type"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="DEPOSIT">정기예금 (목돈 굴리기)</option>
                <option value="SAVINGS">정기적금 (매월 납입)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">금융기관명 *</label>
              <input
                v-model="form.bank_name"
                type="text"
                placeholder="예: 토스뱅크, KB국민"
                required
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">상품명 *</label>
            <input
              v-model="form.product_name"
              type="text"
              placeholder="예: 자유적금, 굴리기 예금"
              required
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">
                {{ form.savings_type === 'SAVINGS' ? '월 납입액 (원) *' : '예금 원금 (원) *' }}
              </label>
              <input
                v-model.number="form.principal"
                type="number"
                placeholder="0"
                required
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">연 이율 (%) *</label>
              <input
                v-model.number="form.interest_rate"
                type="number"
                step="0.01"
                placeholder="예: 3.5"
                required
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">가입 기간 (개월) *</label>
              <input
                v-model.number="form.period_months"
                type="number"
                placeholder="12"
                required
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">과세 구분</label>
              <select
                v-model="form.tax_type"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="NORMAL">일반과세 (15.4%)</option>
                <option value="PREFERENTIAL">세금우대 (9.5%)</option>
                <option value="EXEMPT">비과세 (0%)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">가입일 (선택)</label>
              <input
                v-model="form.start_date"
                type="date"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">만기일 (선택)</label>
              <input
                v-model="form.maturity_date"
                type="date"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <!-- Live Preview Box inside Modal -->
          <div class="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs space-y-1">
            <div class="font-bold text-purple-300 mb-2">⚡ 실시간 만기 수령 예상액 계산기</div>
            <div class="flex justify-between text-slate-300">
              <span>총 납입 원금:</span>
              <span>₩ {{ formatNumber(previewCalc.totalPrincipal) }}</span>
            </div>
            <div class="flex justify-between text-slate-300">
              <span>세후 예상 이자:</span>
              <span class="text-emerald-400 font-semibold">+₩ {{ formatNumber(previewCalc.netInterest) }}</span>
            </div>
            <div class="flex justify-between text-slate-200 font-bold pt-1 border-t border-purple-800/40">
              <span>만기 시 총 수령액:</span>
              <span class="text-purple-300 text-sm">₩ {{ formatNumber(previewCalc.maturityAmount) }}</span>
            </div>
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
import { Plus, PiggyBank, Pencil, Trash2, X } from 'lucide-vue-next'
import { calculateSavingsMaturity } from '~/server/utils/savingsCalc'

const savingsList = ref([])
const loading = ref(false)
const submitting = ref(false)
const showModal = ref(false)
const isEditing = ref(false)
const currentId = ref(null)

const form = ref({
  bank_name: '',
  product_name: '',
  savings_type: 'DEPOSIT',
  principal: 1000000,
  period_months: 12,
  interest_rate: 3.5,
  tax_type: 'NORMAL',
  start_date: '',
  maturity_date: '',
  note: ''
})

const previewCalc = computed(() => {
  return calculateSavingsMaturity({
    savings_type: form.value.savings_type,
    principal: form.value.principal,
    period_months: form.value.period_months,
    interest_rate: form.value.interest_rate,
    tax_type: form.value.tax_type
  })
})

const summary = computed(() => {
  let totalPrincipal = 0
  let totalGrossInterest = 0
  let totalNetInterest = 0
  let totalMaturityAmount = 0

  savingsList.value.forEach(item => {
    if (item.calculation) {
      totalPrincipal += item.calculation.totalPrincipal
      totalGrossInterest += item.calculation.grossInterest
      totalNetInterest += item.calculation.netInterest
      totalMaturityAmount += item.calculation.maturityAmount
    }
  })

  return { totalPrincipal, totalGrossInterest, totalNetInterest, totalMaturityAmount }
})

const formatNumber = (val) => {
  if (val === undefined || val === null) return '0'
  return Math.round(val).toLocaleString()
}

const getTaxLabel = (taxType) => {
  if (taxType === 'EXEMPT') return '비과세 (0%)'
  if (taxType === 'PREFERENTIAL') return '세금우대 (9.5%)'
  return '일반과세 (15.4%)'
}

const getProgressPercent = (start, end) => {
  if (!start || !end) return 0
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  const now = new Date().getTime()

  if (now <= s) return 0
  if (now >= e) return 100

  const pct = ((now - s) / (e - s)) * 100
  return Math.min(100, Math.max(0, Math.round(pct)))
}

const getDDayText = (end) => {
  if (!end) return ''
  const e = new Date(end).getTime()
  const now = new Date().getTime()
  const diffDays = Math.ceil((e - now) / (1000 * 3600 * 24))

  if (diffDays < 0) return '만기 경과'
  if (diffDays === 0) return 'D-Day (오늘 만기)'
  return `D-${diffDays}`
}

const loadSavings = async () => {
  loading.value = true
  try {
    const res = await $fetch('/api/savings')
    if (res.success) {
      savingsList.value = res.data
    }
  } catch (err) {
    console.error('Failed to load savings:', err)
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  isEditing.value = false
  currentId.value = null
  const today = new Date().toISOString().split('T')[0]
  const nextYear = new Date()
  nextYear.setFullYear(nextYear.getFullYear() + 1)
  const nextYearStr = nextYear.toISOString().split('T')[0]

  form.value = {
    bank_name: '',
    product_name: '',
    savings_type: 'DEPOSIT',
    principal: 1000000,
    period_months: 12,
    interest_rate: 3.5,
    tax_type: 'NORMAL',
    start_date: today,
    maturity_date: nextYearStr,
    note: ''
  }
  showModal.value = true
}

const openEditModal = (item) => {
  isEditing.value = true
  currentId.value = item.id
  form.value = {
    bank_name: item.bank_name,
    product_name: item.product_name,
    savings_type: item.savings_type || 'DEPOSIT',
    principal: item.principal,
    period_months: item.period_months,
    interest_rate: item.interest_rate,
    tax_type: item.tax_type || 'NORMAL',
    start_date: item.start_date ? String(item.start_date).split('T')[0] : '',
    maturity_date: item.maturity_date ? String(item.maturity_date).split('T')[0] : '',
    note: item.note || ''
  }
  showModal.value = true
}

const saveSavings = async () => {
  submitting.value = true
  try {
    if (isEditing.value && currentId.value) {
      await $fetch(`/api/savings/${currentId.value}`, { method: 'PUT', body: form.value })
    } else {
      await $fetch('/api/savings', { method: 'POST', body: form.value })
    }
    showModal.value = false
    await loadSavings()
  } catch (err) {
    alert('예/적금 저장 중 오류가 발생했습니다: ' + (err.message || String(err)))
  } finally {
    submitting.value = false
  }
}

const deleteSavings = async (id) => {
  if (!confirm('정말 이 예/적금 항목을 삭제하시겠습니까?')) return
  try {
    await $fetch(`/api/savings/${id}`, { method: 'DELETE' })
    await loadSavings()
  } catch (err) {
    alert('삭제 중 오류가 발생했습니다.')
  }
}

onMounted(() => {
  loadSavings()
})
</script>
