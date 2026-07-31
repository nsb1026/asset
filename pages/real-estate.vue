<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">부동산 자산 관리</h1>
        <p class="text-slate-400 text-sm mt-1">보유 부동산 자산을 취득 금액 기준으로 등록 및 조회하여 관리하세요.</p>
      </div>

      <button
        @click="openAddModal"
        class="inline-flex items-center space-x-2 btn-primary text-sm font-medium bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
      >
        <Plus class="w-4 h-4" />
        <span>신규 부동산 등록</span>
      </button>
    </div>

    <!-- Summary Banner -->
    <div class="glass-card p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">총 부동산 취득 자산 합계</span>
        <div class="text-3xl font-extrabold text-emerald-300 mt-1">
          ₩ {{ formatNumber(totalAcquisitionPrice) }}
        </div>
      </div>
      <div class="flex items-center space-x-2 text-xs text-slate-400">
        <div class="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
          총 <span class="text-emerald-400 font-bold">{{ realEstates.length }}</span>개 부동산 보유
        </div>
      </div>
    </div>

    <!-- Real Estates Grid -->
    <div v-if="loading" class="text-center py-12 text-slate-500">
      부동산 데이터를 불러오는 중...
    </div>

    <div v-else-if="realEstates.length === 0" class="glass-card p-12 text-center">
      <div class="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-500">
        <Home class="w-8 h-8 text-emerald-400" />
      </div>
      <h3 class="text-lg font-bold text-white mb-1">등록된 부동산 자산이 없습니다</h3>
      <p class="text-slate-400 text-sm mb-6">아파트, 오피스텔, 토지 등의 부동산 자산을 취득 금액 기준으로 등록해 보세요.</p>
      <button @click="openAddModal" class="btn-primary text-sm inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500">
        <Plus class="w-4 h-4" />
        <span>첫 부동산 등록하기</span>
      </button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="re in realEstates"
        :key="re.id"
        class="glass-card glass-card-hover p-6 flex flex-col justify-between"
      >
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold">
              {{ re.property_type }}
            </span>
            <div class="flex items-center space-x-1">
              <button @click="openEditModal(re)" class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                <Pencil class="w-4 h-4" />
              </button>
              <button @click="deleteRealEstate(re.id)" class="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <h3 class="text-xl font-bold text-white leading-tight mb-1">{{ re.property_name }}</h3>
          <p class="text-xs text-slate-400 flex items-center space-x-1 mb-4">
            <MapPin class="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span class="truncate">{{ re.location || '위치 미입력' }}</span>
          </p>
        </div>

        <div class="border-t border-slate-800/80 pt-4 mt-2">
          <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>취득 금액</span>
            <span v-if="re.acquisition_date" class="font-mono text-slate-500 text-[11px]">취득일: {{ formatDate(re.acquisition_date) }}</span>
          </div>
          <div class="text-2xl font-extrabold text-white">
            ₩ {{ formatNumber(re.acquisition_price) }}
          </div>
          <p v-if="re.note" class="text-xs text-slate-500 mt-2 truncate">{{ re.note }}</p>
        </div>
      </div>
    </div>

    <!-- Modal Form (Add / Edit) -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div class="glass-card w-full max-w-md p-6 bg-slate-900 border border-slate-700 shadow-2xl relative">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-white">{{ isEditing ? '부동산 자산 수정' : '신규 부동산 등록' }}</h3>
          <button @click="showModal = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveRealEstate" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">부동산 명칭 *</label>
            <input
              v-model="form.property_name"
              type="text"
              placeholder="예: 마포 아파트 84㎡, 강남 빌딩"
              required
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">부동산 종류</label>
              <select
                v-model="form.property_type"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="아파트">아파트</option>
                <option value="빌라/주택">빌라/주택</option>
                <option value="오피스텔">오피스텔</option>
                <option value="상가">상가</option>
                <option value="토지">토지</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">취득일 (선택)</label>
              <input
                v-model="form.acquisition_date"
                type="date"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">소재지 / 주소 (선택)</label>
            <input
              v-model="form.location"
              type="text"
              placeholder="예: 서울특별시 마포구 공덕동"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">취득 금액 (원) *</label>
            <input
              v-model.number="form.acquisition_price"
              type="number"
              placeholder="0"
              required
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono font-bold text-emerald-300"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">메모 (선택)</label>
            <textarea
              v-model="form.note"
              rows="2"
              placeholder="실거주 자가, 임대 보증금 정보 등"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
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
              class="btn-primary text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
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
import { Plus, Home, MapPin, Pencil, Trash2, X } from 'lucide-vue-next'

const realEstates = ref([])
const loading = ref(false)
const submitting = ref(false)
const showModal = ref(false)
const isEditing = ref(false)
const currentId = ref(null)

const form = ref({
  property_name: '',
  property_type: '아파트',
  location: '',
  acquisition_price: 0,
  acquisition_date: '',
  note: ''
})

const totalAcquisitionPrice = computed(() => {
  return realEstates.value.reduce((sum, item) => sum + Number(item.acquisition_price || 0), 0)
})

const formatNumber = (val) => {
  if (val === undefined || val === null) return '0'
  return Math.round(val).toLocaleString()
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return String(dateStr).split('T')[0]
}

const loadRealEstates = async () => {
  loading.value = true
  try {
    const res = await $fetch('/api/real-estate')
    if (res.success) {
      realEstates.value = res.data
    }
  } catch (err) {
    console.error('Failed to load real estates:', err)
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  isEditing.value = false
  currentId.value = null
  form.value = {
    property_name: '',
    property_type: '아파트',
    location: '',
    acquisition_price: 0,
    acquisition_date: new Date().toISOString().split('T')[0],
    note: ''
  }
  showModal.value = true
}

const openEditModal = (re) => {
  isEditing.value = true
  currentId.value = re.id
  form.value = {
    property_name: re.property_name,
    property_type: re.property_type || '아파트',
    location: re.location || '',
    acquisition_price: re.acquisition_price,
    acquisition_date: re.acquisition_date ? formatDate(re.acquisition_date) : '',
    note: re.note || ''
  }
  showModal.value = true
}

const saveRealEstate = async () => {
  submitting.value = true
  try {
    if (isEditing.value && currentId.value) {
      await $fetch(`/api/real-estate/${currentId.value}`, { method: 'PUT', body: form.value })
    } else {
      await $fetch('/api/real-estate', { method: 'POST', body: form.value })
    }
    showModal.value = false
    await loadRealEstates()
  } catch (err) {
    alert('부동산 저장 중 오류가 발생했습니다: ' + (err.message || String(err)))
  } finally {
    submitting.value = false
  }
}

const deleteRealEstate = async (id) => {
  if (!confirm('정말 이 부동산 항목을 삭제하시겠습니까?')) return
  try {
    await $fetch(`/api/real-estate/${id}`, { method: 'DELETE' })
    await loadRealEstates()
  } catch (err) {
    alert('삭제 중 오류가 발생했습니다.')
  }
}

onMounted(() => {
  loadRealEstates()
})
</script>
