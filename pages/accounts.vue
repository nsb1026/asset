<template>
  <div class="space-y-8">
    <!-- 헤더 영역 -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">은행 통장 관리</h1>
        <p class="text-slate-400 text-sm mt-1">은행별 입출금 통장 및 계좌 잔액을 관리하세요.</p>
      </div>

      <button
        @click="openAddModal"
        class="inline-flex items-center space-x-2 btn-primary text-sm font-medium"
      >
        <Plus class="w-4 h-4" />
        <span>새 계좌 추가</span>
      </button>
    </div>

    <!-- 통장 잔액 요약 배너 -->
    <div class="glass-card p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">전체 은행 계좌 잔액 합계</span>
        <div class="text-3xl font-extrabold text-white mt-1">
          ₩ {{ formatNumber(totalBalance) }}
        </div>
      </div>
      <div class="flex items-center space-x-2 text-xs text-slate-400">
        <div class="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
          총 <span class="text-indigo-400 font-bold">{{ accounts.length }}</span>개 계좌 보유
        </div>
      </div>
    </div>

    <!-- 계좌 카드리스트 그리드 -->
    <div v-if="loading" class="text-center py-12 text-slate-500">
      계좌 목록을 불러오는 중...
    </div>

    <div v-else-if="accounts.length === 0" class="glass-card p-12 text-center">
      <div class="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-500">
        <Building2 class="w-8 h-8" />
      </div>
      <h3 class="text-lg font-bold text-white mb-1">등록된 계좌가 없습니다</h3>
      <p class="text-slate-400 text-sm mb-6">상단의 [새 계좌 추가] 버튼을 눌러 첫 통장을 등록해 보세요.</p>
      <button @click="openAddModal" class="btn-primary text-sm inline-flex items-center space-x-2">
        <Plus class="w-4 h-4" />
        <span>계좌 등록하기</span>
      </button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="acc in accounts"
        :key="acc.id"
        class="glass-card glass-card-hover p-6 flex flex-col justify-between"
      >
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-bold">
              {{ acc.bank_name }}
            </span>
            <div class="flex items-center space-x-1">
              <button @click="openEditModal(acc)" class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                <Pencil class="w-4 h-4" />
              </button>
              <button @click="deleteAccount(acc.id)" class="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <h3 class="text-lg font-bold text-white leading-tight mb-1">{{ acc.account_name }}</h3>
          <p class="text-xs text-slate-500 font-mono mb-4">{{ acc.account_number || '계좌번호 미입력' }}</p>
        </div>

        <div class="border-t border-slate-800/80 pt-4 mt-2">
          <div class="text-xs text-slate-400 mb-1">통장 잔액</div>
          <div class="text-2xl font-extrabold text-white">
            ₩ {{ formatNumber(acc.balance) }}
          </div>
          <p v-if="acc.note" class="text-xs text-slate-500 mt-2 truncate">{{ acc.note }}</p>
        </div>
      </div>
    </div>

    <!-- 신규 추가 / 수정 모달 팝업 -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div class="glass-card w-full max-w-md p-6 bg-slate-900 border border-slate-700 shadow-2xl relative">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-white">{{ isEditing ? '계좌 정보 수정' : '새 통장 계좌 등록' }}</h3>
          <button @click="showModal = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveAccount" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">은행/금융사명 *</label>
            <input
              v-model="form.bank_name"
              type="text"
              placeholder="예: KB국민, 신한, 토스, 카카오뱅크 등"
              required
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">통장 별칭/상품명 *</label>
            <input
              v-model="form.account_name"
              type="text"
              placeholder="예: 주거래 입출금 통장, 생활비 계좌"
              required
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">계좌번호 (선택)</label>
            <input
              v-model="form.account_number"
              type="text"
              placeholder="110-123-456789"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">현재 잔액 (원) *</label>
            <input
              v-model.number="form.balance"
              type="number"
              placeholder="0"
              required
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">메모 (선택)</label>
            <textarea
              v-model="form.note"
              rows="2"
              placeholder="특이사항 메모"
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
/**
 * 은행 통장 계좌 관리 컴포넌트
 * - 계좌 목록 조회, 신규 등록, 수정, 삭제 기능 및 총 통장 잔액 자동 합계 계산
 */
import { ref, computed, onMounted } from 'vue'
import { Plus, Building2, Pencil, Trash2, X } from 'lucide-vue-next'

const accounts = ref([])
const loading = ref(false)
const submitting = ref(false)
const showModal = ref(false)
const isEditing = ref(false)
const currentId = ref(null)

// 모달 입력 폼 객체
const form = ref({
  bank_name: '',
  account_name: '',
  account_number: '',
  balance: 0,
  note: ''
})

// 총 통장 잔액 계산
const totalBalance = computed(() => {
  return accounts.value.reduce((sum, item) => sum + Number(item.balance || 0), 0)
})

// 금액 천단위 콤마 포맷팅 헬퍼
const formatNumber = (val) => {
  if (val === undefined || val === null) return '0'
  return Math.round(val).toLocaleString()
}

// 계좌 목록 불러오기
const loadAccounts = async () => {
  loading.value = true
  try {
    const res = await $fetch('/api/accounts')
    if (res.success) {
      accounts.value = res.data
    }
  } catch (err) {
    console.error('계좌 목록 불러오기 실패:', err)
  } finally {
    loading.value = false
  }
}

// 신규 추가 모달 열기
const openAddModal = () => {
  isEditing.value = false
  currentId.value = null
  form.value = { bank_name: '', account_name: '', account_number: '', balance: 0, note: '' }
  showModal.value = true
}

// 수정 모달 열기
const openEditModal = (acc) => {
  isEditing.value = true
  currentId.value = acc.id
  form.value = {
    bank_name: acc.bank_name,
    account_name: acc.account_name,
    account_number: acc.account_number || '',
    balance: acc.balance,
    note: acc.note || ''
  }
  showModal.value = true
}

// 계좌 저장 (등록 또는 수정)
const saveAccount = async () => {
  submitting.value = true
  try {
    if (isEditing.value && currentId.value) {
      await $fetch(`/api/accounts/${currentId.value}`, { method: 'PUT', body: form.value })
    } else {
      await $fetch('/api/accounts', { method: 'POST', body: form.value })
    }
    showModal.value = false
    await loadAccounts()
  } catch (err) {
    alert('계좌 저장 중 오류가 발생했습니다: ' + (err.message || String(err)))
  } finally {
    submitting.value = false
  }
}

// 계좌 삭제
const deleteAccount = async (id) => {
  if (!confirm('정말 이 계좌를 삭제하시겠습니까?')) return
  try {
    await $fetch(`/api/accounts/${id}`, { method: 'DELETE' })
    await loadAccounts()
  } catch (err) {
    alert('계좌 삭제 중 오류가 발생했습니다.')
  }
}

onMounted(() => {
  loadAccounts()
})
</script>
