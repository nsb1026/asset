<template>
  <div class="space-y-8">
    <!-- 헤더 영역 -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">자산 추이 & 가계부 관리</h1>
        <p class="text-slate-400 text-sm mt-1">원하는 날짜의 총 자산을 기록하고 일별 가계부 작성으로 월별/년별 지출 추이를 분석하세요.</p>
      </div>

      <div class="flex items-center space-x-3">
        <button
          @click="openSnapshotModal"
          class="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-600/30"
        >
          <Camera class="w-4 h-4" />
          <span>자산 스냅샷 저장</span>
        </button>

        <button
          @click="openAddLedgerModal"
          class="inline-flex items-center space-x-2 btn-primary text-sm font-medium"
        >
          <Plus class="w-4 h-4" />
          <span>가계부 내역 작성</span>
        </button>
      </div>
    </div>

    <!-- 탭 네비게이션 -->
    <div class="flex border-b border-slate-800 space-x-2 text-sm font-semibold">
      <button
        @click="activeTab = 'ASSET_TREND'"
        class="pb-3 px-4 border-b-2 transition-all flex items-center space-x-2"
        :class="activeTab === 'ASSET_TREND' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'"
      >
        <TrendingUp class="w-4 h-4" />
        <span>1. 총 자산 추이 그래프</span>
      </button>

      <button
        @click="activeTab = 'LEDGER_TREND'"
        class="pb-3 px-4 border-b-2 transition-all flex items-center space-x-2"
        :class="activeTab === 'LEDGER_TREND' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'"
      >
        <BarChart3 class="w-4 h-4" />
        <span>2. 월별 & 년별 가계부 추이</span>
      </button>

      <button
        @click="activeTab = 'LEDGER_LIST'"
        class="pb-3 px-4 border-b-2 transition-all flex items-center space-x-2"
        :class="activeTab === 'LEDGER_LIST' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'"
      >
        <Receipt class="w-4 h-4" />
        <span>3. 일별 가계부 내역</span>
      </button>
    </div>

    <!-- TAB 1: 총 자산 추이 그래프 & 자산 스냅샷 이력 -->
    <div v-if="activeTab === 'ASSET_TREND'" class="space-y-6">
      <!-- 총 자산 변동 선 그래프 Card -->
      <div class="glass-card p-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 class="text-lg font-bold text-white flex items-center space-x-2">
              <TrendingUp class="w-5 h-5 text-indigo-400" />
              <span>날짜별 총 자산 변동 추이 (Line Chart)</span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">저장된 자산 스냅샷 이력을 바탕으로 총 자산의 성장 그래프를 보여줍니다.</p>
          </div>

          <div class="text-xs text-slate-400 font-medium">
            최근 기록: <span class="text-indigo-300 font-bold">₩ {{ formatNumber(latestAssetRecord) }}</span>
          </div>
        </div>

        <!-- Line Chart Canvas -->
        <div class="h-72 w-full relative">
          <Line v-if="assetChartReady" :data="assetLineChartData" :options="lineChartOptions" />
          <div v-else class="flex items-center justify-center h-full text-slate-500 text-xs">
            자산 추이 그래프 생성 중...
          </div>
        </div>
      </div>

      <!-- 자산 이력 수동 기록 테이블 -->
      <div class="glass-card p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-white">날짜별 자산 기록 이력 (총 {{ assetHistory.length }}건)</h3>
          <button @click="openSnapshotModal" class="text-xs text-indigo-400 hover:underline">
            + 특정 날짜 자산 직접 등록
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-900/80 text-slate-400 text-xs border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">기록 날짜</th>
                <th class="py-3 px-4">총 자산</th>
                <th class="py-3 px-4">통장 잔액</th>
                <th class="py-3 px-4">주식 평가금</th>
                <th class="py-3 px-4">예적금</th>
                <th class="py-3 px-4">펀드</th>
                <th class="py-3 px-4">부동산</th>
                <th class="py-3 px-4 text-center">세부 내역</th>
                <th class="py-3 px-4">비고</th>
                <th class="py-3 px-4 text-right">삭제</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/50">
              <tr v-for="h in assetHistory" :key="h.id" class="hover:bg-slate-900/40">
                <td class="py-3 px-4 font-mono font-bold text-white">{{ formatDate(h.record_date) }}</td>
                <td class="py-3 px-4 font-mono font-extrabold text-indigo-300">₩ {{ formatNumber(h.total_asset) }}</td>
                <td class="py-3 px-4 font-mono text-slate-300">₩ {{ formatNumber(h.bank_balance) }}</td>
                <td class="py-3 px-4 font-mono text-slate-300">₩ {{ formatNumber(h.stock_valuation) }}</td>
                <td class="py-3 px-4 font-mono text-slate-300">₩ {{ formatNumber(h.savings_amount) }}</td>
                <td class="py-3 px-4 font-mono text-slate-300">₩ {{ formatNumber(h.fund_valuation) }}</td>
                <td class="py-3 px-4 font-mono text-slate-300">₩ {{ formatNumber(h.real_estate_amount) }}</td>
                <td class="py-3 px-4 text-center">
                  <button
                    @click="openDetailModal(h)"
                    class="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition-colors"
                  >
                    <Search class="w-3.5 h-3.5" />
                    <span>상세보기</span>
                  </button>
                </td>
                <td class="py-3 px-4 text-xs text-slate-400">{{ h.note || '-' }}</td>
                <td class="py-3 px-4 text-right">
                  <button @click="deleteHistory(h.id)" class="p-1 text-slate-400 hover:text-rose-400">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 2: 월별 / 년별 가계부 수입 vs 지출 추이 그래프 -->
    <div v-if="activeTab === 'LEDGER_TREND'" class="space-y-6">
      <!-- 가계부 누적 요약 카세트 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div class="glass-card p-6">
          <span class="text-xs text-slate-400 font-semibold uppercase">총 누적 수입</span>
          <div class="text-3xl font-extrabold text-emerald-400 mt-1">
            +₩ {{ formatNumber(ledgerStats.summary?.totalIncome) }}
          </div>
        </div>

        <div class="glass-card p-6">
          <span class="text-xs text-slate-400 font-semibold uppercase">총 누적 지출</span>
          <div class="text-3xl font-extrabold text-rose-400 mt-1">
            -₩ {{ formatNumber(ledgerStats.summary?.totalExpense) }}
          </div>
        </div>

        <div class="glass-card p-6">
          <span class="text-xs text-slate-400 font-semibold uppercase">총 순저축 / 잉여금</span>
          <div
            class="text-3xl font-extrabold mt-1"
            :class="(ledgerStats.summary?.netSavings || 0) >= 0 ? 'text-indigo-300' : 'text-rose-400'"
          >
            ₩ {{ formatNumber(ledgerStats.summary?.netSavings) }}
          </div>
        </div>
      </div>

      <!-- 월별 수입 vs 지출 추이 막대 그래프 -->
      <div class="glass-card p-6">
        <h3 class="text-lg font-bold text-white mb-1 flex items-center space-x-2">
          <BarChart3 class="w-5 h-5 text-indigo-400" />
          <span>월별 수입 vs 지출 추이 (Monthly Income vs Expense)</span>
        </h3>
        <p class="text-xs text-slate-400 mb-6">월별 수입과 지출의 변화 흐름을 막대 차트로 비교합니다.</p>

        <div class="h-72 w-full relative">
          <Bar v-if="monthlyChartReady" :data="monthlyBarChartData" :options="barChartOptions" />
          <div v-else class="flex items-center justify-center h-full text-slate-500 text-xs">
            월별 차트 데이터 준비 중...
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 년별 수입 vs 지출 추이 막대 그래프 -->
        <div class="glass-card p-6">
          <h3 class="text-lg font-bold text-white mb-1 flex items-center space-x-2">
            <Calendar class="w-5 h-5 text-indigo-400" />
            <span>년별 수입 vs 지출 추이 (Yearly Trend)</span>
          </h3>
          <p class="text-xs text-slate-400 mb-6">연도별 총 수입과 총 지출 비교</p>

          <div class="h-64 w-full relative">
            <Bar v-if="yearlyChartReady" :data="yearlyBarChartData" :options="barChartOptions" />
            <div v-else class="flex items-center justify-center h-full text-slate-500 text-xs">
              년별 차트 데이터 준비 중...
            </div>
          </div>
        </div>

        <!-- 지출 카테고리별 비중 도넛 차트 -->
        <div class="glass-card p-6">
          <h3 class="text-lg font-bold text-white mb-1 flex items-center space-x-2">
            <PieChart class="w-5 h-5 text-purple-400" />
            <span>카테고리별 지출 분포</span>
          </h3>
          <p class="text-xs text-slate-400 mb-6">항목별 지출 비율 분석</p>

          <div class="h-64 w-full relative flex items-center justify-center">
            <Doughnut v-if="categoryChartReady" :data="categoryDoughnutData" :options="doughnutOptions" />
            <div v-else class="flex items-center justify-center h-full text-slate-500 text-xs">
              지출 카테고리 데이터 준비 중...
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: 일별 가계부 수동 내역 작성 및 조회 -->
    <div v-if="activeTab === 'LEDGER_LIST'" class="space-y-6">
      <div class="glass-card p-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 class="font-bold text-white text-lg">일별 가계부 내역 (총 {{ ledgerList.length }}건)</h3>
          
          <!-- 검색 및 필터 -->
          <div class="flex items-center space-x-2">
            <select v-model="filterYear" @change="loadLedgerList" class="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white">
              <option value="">전체 연도</option>
              <option value="2026">2026년</option>
              <option value="2025">2025년</option>
            </select>

            <select v-model="filterMonth" @change="loadLedgerList" class="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white">
              <option value="">전체 월</option>
              <option v-for="m in 12" :key="m" :value="m">{{ m }}월</option>
            </select>

            <button @click="openAddLedgerModal" class="btn-primary text-xs px-3 py-1.5">
              + 일별 내역 수동 추가
            </button>
          </div>
        </div>

        <div v-if="ledgerList.length === 0" class="text-center py-12 text-slate-500 text-sm">
          등록된 가계부 내역이 없습니다. [일별 내역 수동 추가] 버튼을 눌러 내역을 작성해 보세요.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-900/80 text-slate-400 text-xs border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">일자</th>
                <th class="py-3 px-4">구분</th>
                <th class="py-3 px-4">카테고리</th>
                <th class="py-3 px-4">금액</th>
                <th class="py-3 px-4">내역 / 비고</th>
                <th class="py-3 px-4 text-right">관리</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/50">
              <tr v-for="item in ledgerList" :key="item.id" class="hover:bg-slate-900/40">
                <td class="py-3 px-4 font-mono text-slate-300">{{ formatDate(item.entry_date) }}</td>
                <td class="py-3 px-4">
                  <span
                    class="px-2 py-0.5 rounded text-xs font-bold"
                    :class="item.entry_type === 'INCOME' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'"
                  >
                    {{ item.entry_type === 'INCOME' ? '수입' : '지출' }}
                  </span>
                </td>
                <td class="py-3 px-4 text-white font-medium">{{ item.category }}</td>
                <td
                  class="py-3 px-4 font-mono font-bold"
                  :class="item.entry_type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'"
                >
                  {{ item.entry_type === 'INCOME' ? '+' : '-' }}₩ {{ formatNumber(item.amount) }}
                </td>
                <td class="py-3 px-4 text-xs text-slate-400">{{ item.memo || '-' }}</td>
                <td class="py-3 px-4 text-right">
                  <div class="flex items-center justify-end space-x-1">
                    <button @click="openEditLedgerModal(item)" class="p-1 text-slate-400 hover:text-white">
                      <Pencil class="w-4 h-4" />
                    </button>
                    <button @click="deleteLedger(item.id)" class="p-1 text-slate-400 hover:text-rose-400">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 팝업 1: 자산 스냅샷 / 날짜 지정 자산 기록 모달 -->
    <div v-if="showSnapshotModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div class="glass-card w-full max-w-md p-6 bg-slate-900 border border-slate-700 shadow-2xl relative">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-white">📸 자산 금액 기록 / 스냅샷 저장</h3>
          <button @click="showSnapshotModal = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveSnapshot" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">기록 날짜 *</label>
            <input
              v-model="snapshotForm.record_date"
              type="date"
              required
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">총 자산 금액 (원) *</label>
            <input
              v-model.number="snapshotForm.total_asset"
              type="number"
              required
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono font-bold text-indigo-300"
            />
            <p class="text-[11px] text-slate-500 mt-1">
              💡 기본값으로 현재 대시보드의 전체 평가 자산 금액이 자동 채워집니다.
            </p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">메모 (선택)</label>
            <input
              v-model="snapshotForm.note"
              type="text"
              placeholder="예: 7월 자산 마감 기록"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              @click="showSnapshotModal = false"
              class="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm"
            >
              취소
            </button>
            <button type="submit" class="btn-primary text-sm">
              스냅샷 저장하기
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 팝업 2: 일별 가계부 작성 모달 -->
    <div v-if="showLedgerModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div class="glass-card w-full max-w-md p-6 bg-slate-900 border border-slate-700 shadow-2xl relative">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-white">{{ isEditingLedger ? '가계부 내역 수정' : '일별 가계부 수동 작성' }}</h3>
          <button @click="showLedgerModal = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveLedger" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">거래 일자 *</label>
              <input
                v-model="ledgerForm.entry_date"
                type="date"
                required
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">구분 *</label>
              <select
                v-model="ledgerForm.entry_type"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="EXPENSE">지출 (-)</option>
                <option value="INCOME">수입 (+)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">카테고리 *</label>
              <select
                v-model="ledgerForm.category"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="식비">식비</option>
                <option value="외식/유흥">외식/유흥</option>
                <option value="교통비">교통비</option>
                <option value="주거/통신">주거/통신</option>
                <option value="쇼핑">쇼핑</option>
                <option value="의료/건강">의료/건강</option>
                <option value="월급">월급</option>
                <option value="부수입">부수입</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">금액 (원) *</label>
              <input
                v-model.number="ledgerForm.amount"
                type="number"
                placeholder="0"
                required
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono font-bold text-white"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">사용 내역 / 적요 (선택)</label>
            <input
              v-model="ledgerForm.memo"
              type="text"
              placeholder="예: 마트 장보기, 저녁 식사"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              @click="showLedgerModal = false"
              class="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm"
            >
              취소
            </button>
            <button type="submit" class="btn-primary text-sm">
              작성 완료
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 팝업 3: 자산 스냅샷 세부 내역 (통장, 주식 등) 상세보기 모달 -->
    <div v-if="showSnapshotDetailModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div class="glass-card w-full max-w-4xl max-h-[90vh] flex flex-col p-6 bg-slate-900 border border-slate-700 shadow-2xl relative overflow-hidden">
        <div class="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div class="flex items-center space-x-2">
              <Camera class="w-5 h-5 text-indigo-400" />
              <h3 class="text-xl font-bold text-white">자산 스냅샷 세부 내역</h3>
              <span class="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold">
                {{ formatDate(selectedSnapshot?.record_date) }}
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-1">
              스냅샷 저장 시점에 기록된 전체 통장, 보유 주식, 예적금, 펀드, 부동산 상세 데이터입니다.
            </p>
          </div>
          <button @click="showSnapshotDetailModal = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div v-if="selectedSnapshot" class="flex-1 overflow-y-auto py-4 space-y-6">
          <!-- 총 자산 및 카테고리 요약 바 -->
          <div class="grid grid-cols-2 sm:grid-cols-6 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <div class="text-[11px] text-slate-400 font-semibold">총 평가 자산</div>
              <div class="text-sm font-extrabold text-indigo-300">₩ {{ formatNumber(selectedSnapshot.total_asset) }}</div>
            </div>
            <div>
              <div class="text-[11px] text-slate-400 font-semibold">은행 통장</div>
              <div class="text-xs font-bold text-cyan-300">₩ {{ formatNumber(selectedSnapshot.bank_balance) }}</div>
            </div>
            <div>
              <div class="text-[11px] text-slate-400 font-semibold">주식 평가금</div>
              <div class="text-xs font-bold text-emerald-300">₩ {{ formatNumber(selectedSnapshot.stock_valuation) }}</div>
            </div>
            <div>
              <div class="text-[11px] text-slate-400 font-semibold">예/적금</div>
              <div class="text-xs font-bold text-purple-300">₩ {{ formatNumber(selectedSnapshot.savings_amount) }}</div>
            </div>
            <div>
              <div class="text-[11px] text-slate-400 font-semibold">펀드</div>
              <div class="text-xs font-bold text-amber-300">₩ {{ formatNumber(selectedSnapshot.fund_valuation) }}</div>
            </div>
            <div>
              <div class="text-[11px] text-slate-400 font-semibold">부동산</div>
              <div class="text-xs font-bold text-teal-300">₩ {{ formatNumber(selectedSnapshot.real_estate_amount) }}</div>
            </div>
          </div>

          <div v-if="!selectedSnapshot.snapshot_details" class="text-center py-12 text-slate-500 text-sm">
            💡 해당 스냅샷 저장 시에는 세부 항목 정보가 저장되지 않았습니다. (금액만 기록됨)
          </div>

          <div v-else class="space-y-6">
            <!-- 탭 전환 -->
            <div class="flex border-b border-slate-800 space-x-1 text-xs font-semibold">
              <button
                @click="snapshotDetailTab = 'ACCOUNTS'"
                class="pb-2 px-3 border-b-2 transition-all flex items-center space-x-1.5"
                :class="snapshotDetailTab === 'ACCOUNTS' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'"
              >
                <Building2 class="w-3.5 h-3.5" />
                <span>은행 통장 ({{ (selectedSnapshot.snapshot_details.accounts || []).length }}개)</span>
              </button>

              <button
                @click="snapshotDetailTab = 'STOCKS'"
                class="pb-2 px-3 border-b-2 transition-all flex items-center space-x-1.5"
                :class="snapshotDetailTab === 'STOCKS' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'"
              >
                <TrendingUp class="w-3.5 h-3.5" />
                <span>보유 주식 ({{ (selectedSnapshot.snapshot_details.stocks || []).length }}종목)</span>
              </button>

              <button
                @click="snapshotDetailTab = 'SAVINGS'"
                class="pb-2 px-3 border-b-2 transition-all flex items-center space-x-1.5"
                :class="snapshotDetailTab === 'SAVINGS' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'"
              >
                <PiggyBank class="w-3.5 h-3.5" />
                <span>예/적금 ({{ (selectedSnapshot.snapshot_details.savings || []).length }}개)</span>
              </button>

              <button
                @click="snapshotDetailTab = 'FUNDS'"
                class="pb-2 px-3 border-b-2 transition-all flex items-center space-x-1.5"
                :class="snapshotDetailTab === 'FUNDS' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'"
              >
                <Coins class="w-3.5 h-3.5" />
                <span>펀드 ({{ (selectedSnapshot.snapshot_details.funds || []).length }}개)</span>
              </button>

              <button
                @click="snapshotDetailTab = 'REAL_ESTATES'"
                class="pb-2 px-3 border-b-2 transition-all flex items-center space-x-1.5"
                :class="snapshotDetailTab === 'REAL_ESTATES' ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-400 hover:text-slate-200'"
              >
                <Home class="w-3.5 h-3.5" />
                <span>부동산 ({{ (selectedSnapshot.snapshot_details.real_estates || []).length }}개)</span>
              </button>
            </div>

            <!-- 1. 통장 내역 -->
            <div v-if="snapshotDetailTab === 'ACCOUNTS'">
              <div v-if="!(selectedSnapshot.snapshot_details.accounts?.length)" class="text-xs text-slate-500 py-4 text-center">기록된 통장이 없습니다.</div>
              <div v-else class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th class="py-2.5 px-3">은행명</th>
                      <th class="py-2.5 px-3">계좌명</th>
                      <th class="py-2.5 px-3">계좌번호</th>
                      <th class="py-2.5 px-3 text-right">잔액</th>
                      <th class="py-2.5 px-3">비고</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/50">
                    <tr v-for="(acc, i) in selectedSnapshot.snapshot_details.accounts" :key="i" class="hover:bg-slate-950/40">
                      <td class="py-2.5 px-3 font-semibold text-white">{{ acc.bank_name }}</td>
                      <td class="py-2.5 px-3 text-slate-200">{{ acc.account_name }}</td>
                      <td class="py-2.5 px-3 font-mono text-slate-400">{{ acc.account_number || '-' }}</td>
                      <td class="py-2.5 px-3 font-mono font-bold text-cyan-300 text-right">₩ {{ formatNumber(acc.balance) }}</td>
                      <td class="py-2.5 px-3 text-slate-400">{{ acc.note || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 2. 주식 내역 -->
            <div v-if="snapshotDetailTab === 'STOCKS'">
              <div v-if="!(selectedSnapshot.snapshot_details.stocks?.length)" class="text-xs text-slate-500 py-4 text-center">기록된 주식이 없습니다.</div>
              <div v-else class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th class="py-2.5 px-3">종목명 (코드)</th>
                      <th class="py-2.5 px-3">구분</th>
                      <th class="py-2.5 px-3 text-right">수량</th>
                      <th class="py-2.5 px-3 text-right">평균 매수가</th>
                      <th class="py-2.5 px-3 text-right">현재가</th>
                      <th class="py-2.5 px-3 text-right">평가금액</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/50">
                    <tr v-for="(s, i) in selectedSnapshot.snapshot_details.stocks" :key="i" class="hover:bg-slate-950/40">
                      <td class="py-2.5 px-3 font-semibold text-white">
                        {{ s.stock_name }} <span class="text-slate-400 font-mono text-[11px]">({{ s.stock_code }})</span>
                      </td>
                      <td class="py-2.5 px-3 text-slate-300">
                        <span class="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 font-medium">
                          {{ s.market_type === 'OVERSEAS' ? '해외' : '국내' }}
                        </span>
                      </td>
                      <td class="py-2.5 px-3 font-mono text-right text-slate-200">{{ formatNumber(s.quantity) }}주</td>
                      <td class="py-2.5 px-3 font-mono text-right text-slate-400">₩ {{ formatNumber(s.avg_buy_price) }}</td>
                      <td class="py-2.5 px-3 font-mono text-right text-slate-200">₩ {{ formatNumber(s.current_price) }}</td>
                      <td class="py-2.5 px-3 font-mono font-bold text-emerald-300 text-right">
                        ₩ {{ formatNumber(s.quantity * (s.current_price || s.avg_buy_price)) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 3. 예적금 내역 -->
            <div v-if="snapshotDetailTab === 'SAVINGS'">
              <div v-if="!(selectedSnapshot.snapshot_details.savings?.length)" class="text-xs text-slate-500 py-4 text-center">기록된 예/적금이 없습니다.</div>
              <div v-else class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th class="py-2.5 px-3">은행명</th>
                      <th class="py-2.5 px-3">상품명</th>
                      <th class="py-2.5 px-3">종류</th>
                      <th class="py-2.5 px-3 text-right">납입/원금</th>
                      <th class="py-2.5 px-3 text-right">금리</th>
                      <th class="py-2.5 px-3 text-right">예상 만기액</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/50">
                    <tr v-for="(sav, i) in selectedSnapshot.snapshot_details.savings" :key="i" class="hover:bg-slate-950/40">
                      <td class="py-2.5 px-3 font-semibold text-white">{{ sav.bank_name }}</td>
                      <td class="py-2.5 px-3 text-slate-200">{{ sav.product_name }}</td>
                      <td class="py-2.5 px-3 text-slate-300">
                        <span class="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 font-medium">
                          {{ sav.savings_type === 'SAVINGS' ? '적금' : '예금' }}
                        </span>
                      </td>
                      <td class="py-2.5 px-3 font-mono text-right text-slate-300">₩ {{ formatNumber(sav.principal) }}</td>
                      <td class="py-2.5 px-3 font-mono text-right text-purple-300 font-semibold">{{ sav.interest_rate }}%</td>
                      <td class="py-2.5 px-3 font-mono font-bold text-purple-300 text-right">
                        ₩ {{ formatNumber(sav.maturity_amount || sav.principal) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 4. 펀드 내역 -->
            <div v-if="snapshotDetailTab === 'FUNDS'">
              <div v-if="!(selectedSnapshot.snapshot_details.funds?.length)" class="text-xs text-slate-500 py-4 text-center">기록된 펀드가 없습니다.</div>
              <div v-else class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th class="py-2.5 px-3">펀드명</th>
                      <th class="py-2.5 px-3">유형</th>
                      <th class="py-2.5 px-3 text-right">투자 원금</th>
                      <th class="py-2.5 px-3 text-right">평가 금액</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/50">
                    <tr v-for="(f, i) in selectedSnapshot.snapshot_details.funds" :key="i" class="hover:bg-slate-950/40">
                      <td class="py-2.5 px-3 font-semibold text-white">{{ f.fund_name }}</td>
                      <td class="py-2.5 px-3 text-slate-300">{{ f.fund_type || '주식형' }}</td>
                      <td class="py-2.5 px-3 font-mono text-right text-slate-400">₩ {{ formatNumber(f.investment_amount) }}</td>
                      <td class="py-2.5 px-3 font-mono font-bold text-amber-300 text-right">₩ {{ formatNumber(f.current_valuation || f.investment_amount) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 5. 부동산 내역 -->
            <div v-if="snapshotDetailTab === 'REAL_ESTATES'">
              <div v-if="!(selectedSnapshot.snapshot_details.real_estates?.length)" class="text-xs text-slate-500 py-4 text-center">기록된 부동산이 없습니다.</div>
              <div v-else class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th class="py-2.5 px-3">자산명</th>
                      <th class="py-2.5 px-3">유형</th>
                      <th class="py-2.5 px-3">소재지</th>
                      <th class="py-2.5 px-3 text-right">취득 금액</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/50">
                    <tr v-for="(re, i) in selectedSnapshot.snapshot_details.real_estates" :key="i" class="hover:bg-slate-950/40">
                      <td class="py-2.5 px-3 font-semibold text-white">{{ re.property_name }}</td>
                      <td class="py-2.5 px-3 text-slate-300">{{ re.property_type }}</td>
                      <td class="py-2.5 px-3 text-slate-400">{{ re.location || '-' }}</td>
                      <td class="py-2.5 px-3 font-mono font-bold text-teal-300 text-right">₩ {{ formatNumber(re.acquisition_price) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end pt-4 border-t border-slate-800">
          <button @click="showSnapshotDetailModal = false" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">
            닫기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 자산 추이 및 가계부 통합 관리 컴포넌트
 * - 총 자산 변동 선 그래프 (Line Chart) 및 날짜별 자산 스냅샷 저장
 * - 월별 & 년별 가계부 수입/지출 추이 분석 막대 그래프 (Bar Chart)
 * - 일별 가계부 수동 내역 작성 및 CRUD
 */
import { ref, computed, onMounted } from 'vue'
import { TrendingUp, BarChart3, Receipt, Camera, Plus, Calendar, PieChart, Pencil, Trash2, X, Search, Building2, Coins, Home, PiggyBank } from 'lucide-vue-next'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const activeTab = ref('ASSET_TREND') // ASSET_TREND | LEDGER_TREND | LEDGER_LIST

// 상태 데이터
const assetHistory = ref([])
const ledgerList = ref([])
const ledgerStats = ref({ summary: { totalIncome: 0, totalExpense: 0, netSavings: 0 }, monthlyTrends: [], yearlyTrends: [], categoryStats: [] })
const dashboardAssetTotal = ref(0)

const filterYear = ref('')
const filterMonth = ref('')

// 스냅샷 상세보기 모달 조작 변수
const showSnapshotDetailModal = ref(false)
const selectedSnapshot = ref(null)
const snapshotDetailTab = ref('ACCOUNTS')

const openDetailModal = (snapshot) => {
  selectedSnapshot.value = snapshot
  snapshotDetailTab.value = 'ACCOUNTS'
  showSnapshotDetailModal.value = true
}

// 모달 조작 변수
const showSnapshotModal = ref(false)
const snapshotForm = ref({
  record_date: new Date().toISOString().split('T')[0],
  total_asset: 0,
  note: ''
})

const showLedgerModal = ref(false)
const isEditingLedger = ref(false)
const currentLedgerId = ref(null)
const ledgerForm = ref({
  entry_date: new Date().toISOString().split('T')[0],
  entry_type: 'EXPENSE',
  category: '식비',
  amount: 0,
  memo: ''
})

// 숫자 포맷팅 헬퍼
const formatNumber = (val) => {
  if (val === undefined || val === null) return '0'
  return Math.round(val).toLocaleString()
}

const formatDate = (dStr) => {
  if (!dStr) return ''
  return String(dStr).split('T')[0]
}

const latestAssetRecord = computed(() => {
  if (assetHistory.value.length === 0) return 0
  return assetHistory.value[assetHistory.value.length - 1].total_asset || 0
})

// 1. 총 자산 추이 선 그래프 데이터 구성 (Line Chart)
const assetChartReady = computed(() => assetHistory.value.length > 0)

const assetLineChartData = computed(() => {
  const labels = assetHistory.value.map(h => formatDate(h.record_date))
  const data = assetHistory.value.map(h => h.total_asset)

  return {
    labels,
    datasets: [
      {
        label: '총 자산 금액 (원)',
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

// 2. 월별 수입 vs 지출 추이 막대 그래프 (Bar Chart)
const monthlyChartReady = computed(() => (ledgerStats.value.monthlyTrends || []).length > 0)

const monthlyBarChartData = computed(() => {
  const trends = ledgerStats.value.monthlyTrends || []
  return {
    labels: trends.map(t => t.month),
    datasets: [
      {
        label: '수입 (+)',
        data: trends.map(t => t.income),
        backgroundColor: '#10b981',
        borderRadius: 6
      },
      {
        label: '지출 (-)',
        data: trends.map(t => t.expense),
        backgroundColor: '#f43f5e',
        borderRadius: 6
      }
    ]
  }
})

// 3. 년별 수입 vs 지출 추이 막대 그래프
const yearlyChartReady = computed(() => (ledgerStats.value.yearlyTrends || []).length > 0)

const yearlyBarChartData = computed(() => {
  const trends = ledgerStats.value.yearlyTrends || []
  return {
    labels: trends.map(t => `${t.year}년`),
    datasets: [
      {
        label: '총 수입',
        data: trends.map(t => t.income),
        backgroundColor: '#10b981',
        borderRadius: 6
      },
      {
        label: '총 지출',
        data: trends.map(t => t.expense),
        backgroundColor: '#f43f5e',
        borderRadius: 6
      }
    ]
  }
})

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#cbd5e1', font: { size: 12 } } },
    tooltip: {
      callbacks: {
        label: (context) => ` ${context.dataset.label}: ₩ ${Number(context.raw).toLocaleString()}`
      }
    }
  },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', callback: (v) => `₩ ${(v/10000).toLocaleString()}만` } }
  }
}

// 4. 지출 카테고리별 도넛 차트
const categoryChartReady = computed(() => (ledgerStats.value.categoryStats || []).length > 0)

const categoryDoughnutData = computed(() => {
  const stats = ledgerStats.value.categoryStats || []
  return {
    labels: stats.map(s => s.category),
    datasets: [
      {
        data: stats.map(s => s.amount),
        backgroundColor: ['#f43f5e', '#fb923c', '#facc15', '#a855f7', '#06b6d4', '#3b82f6', '#10b981'],
        borderWidth: 0
      }
    ]
  }
})

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right', labels: { color: '#cbd5e1', font: { size: 11 } } }
  }
}

// API 호출 로직
const loadAssetHistory = async () => {
  try {
    const res = await $fetch('/api/history')
    if (res.success) {
      assetHistory.value = res.data
    }
  } catch (err) {
    console.error('Failed to load asset history:', err)
  }
}

const loadLedgerList = async () => {
  try {
    let url = '/api/ledger'
    const queryParts = []
    if (filterYear.value) queryParts.push(`year=${filterYear.value}`)
    if (filterMonth.value) queryParts.push(`month=${filterMonth.value}`)
    if (queryParts.length > 0) url += `?${queryParts.join('&')}`

    const res = await $fetch(url)
    if (res.success) {
      ledgerList.value = res.data
    }
  } catch (err) {
    console.error('Failed to load ledger list:', err)
  }
}

const loadLedgerStats = async () => {
  try {
    const res = await $fetch('/api/ledger/stats')
    if (res.success) {
      ledgerStats.value = res
    }
  } catch (err) {
    console.error('Failed to load ledger stats:', err)
  }
}

const loadCurrentDashboardTotal = async () => {
  try {
    const res = await $fetch('/api/dashboard')
    if (res.success && res.summary) {
      dashboardAssetTotal.value = res.summary.totalAssetValue || 0
    }
  } catch (err) {
    console.error('Failed to load dashboard total:', err)
  }
}

// 모달 제어
const openSnapshotModal = async () => {
  await loadCurrentDashboardTotal()
  snapshotForm.value = {
    record_date: new Date().toISOString().split('T')[0],
    total_asset: dashboardAssetTotal.value,
    note: ''
  }
  showSnapshotModal.value = true
}

const saveSnapshot = async () => {
  try {
    const res = await $fetch('/api/history', { method: 'POST', body: snapshotForm.value })
    alert(res.message || '자산 스냅샷이 저장되었습니다.')
    showSnapshotModal.value = false
    await loadAssetHistory()
  } catch (err) {
    alert('스냅샷 저장 실패: ' + err.message)
  }
}

const deleteHistory = async (id) => {
  if (!confirm('해당 자산 이력 기록을 삭제하시겠습니까?')) return
  try {
    await $fetch(`/api/history/${id}`, { method: 'DELETE' })
    await loadAssetHistory()
  } catch (err) {
    alert('삭제 실패')
  }
}

const openAddLedgerModal = () => {
  isEditingLedger.value = false
  currentLedgerId.value = null
  ledgerForm.value = {
    entry_date: new Date().toISOString().split('T')[0],
    entry_type: 'EXPENSE',
    category: '식비',
    amount: 0,
    memo: ''
  }
  showLedgerModal.value = true
}

const openEditLedgerModal = (item) => {
  isEditingLedger.value = true
  currentLedgerId.value = item.id
  ledgerForm.value = {
    entry_date: formatDate(item.entry_date),
    entry_type: item.entry_type || 'EXPENSE',
    category: item.category || '기타',
    amount: item.amount,
    memo: item.memo || ''
  }
  showLedgerModal.value = true
}

const saveLedger = async () => {
  try {
    if (isEditingLedger.value && currentLedgerId.value) {
      await $fetch(`/api/ledger/${currentLedgerId.value}`, { method: 'PUT', body: ledgerForm.value })
    } else {
      await $fetch('/api/ledger', { method: 'POST', body: ledgerForm.value })
    }
    showLedgerModal.value = false
    await loadLedgerList()
    await loadLedgerStats()
  } catch (err) {
    alert('가계부 저장 오류: ' + err.message)
  }
}

const deleteLedger = async (id) => {
  if (!confirm('정말 이 가계부 항목을 삭제하시겠습니까?')) return
  try {
    await $fetch(`/api/ledger/${id}`, { method: 'DELETE' })
    await loadLedgerList()
    await loadLedgerStats()
  } catch (err) {
    alert('삭제 오류')
  }
}

onMounted(async () => {
  await loadAssetHistory()
  await loadLedgerList()
  await loadLedgerStats()
})
</script>
