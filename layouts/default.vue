<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
    <!-- 모바일 전용 상단 헤더 -->
    <header class="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-lg bg-slate-900/90">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30 text-sm">
          ₩
        </div>
        <span class="font-bold text-base text-white tracking-wide">내 자산 관리</span>
      </div>

      <div class="flex items-center space-x-2">
        <!-- 모바일 로그아웃 버튼 -->
        <button
          @click="handleLogout"
          title="로그아웃"
          class="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <LogOut class="w-5 h-5" />
        </button>
        <!-- 모바일 메뉴 토글 버튼 -->
        <button @click="mobileMenuOpen = !mobileMenuOpen" class="text-slate-400 hover:text-white p-2">
          <Menu v-if="!mobileMenuOpen" class="w-6 h-6" />
          <X v-else class="w-6 h-6" />
        </button>
      </div>
    </header>

    <!-- 모바일 메뉴 배경 오버레이 -->
    <div
      v-if="mobileMenuOpen"
      @click="mobileMenuOpen = false"
      class="md:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30"
    ></div>

    <!-- 좌측 주 네비게이션 사이드바 (데스크톱 및 모바일 서랍) -->
    <aside
      :class="[
        'w-full md:w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col transition-all duration-300 z-40',
        mobileMenuOpen ? 'fixed inset-y-0 left-0 w-4/5 max-w-xs block shadow-2xl' : 'hidden md:flex'
      ]"
    >
      <!-- 로고 영역 -->
      <div class="hidden md:flex items-center space-x-3 p-6 border-b border-slate-800/60">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-indigo-500/25">
          ₩
        </div>
        <div>
          <h1 class="font-bold text-lg text-white leading-tight">내 자산 관리</h1>
        </div>
      </div>

      <!-- 메뉴 링크 목록 -->
      <nav class="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <!-- 1. 종합 대시보드 -->
        <NuxtLink
          to="/"
          @click="mobileMenuOpen = false"
          class="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200"
          :class="[
            route.path === '/'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          ]"
        >
          <LayoutDashboard class="w-5 h-5" />
          <span>종합 대시보드</span>
        </NuxtLink>

        <!-- 2. 가계부 & 자산 추이 -->
        <NuxtLink
          to="/ledger"
          @click="mobileMenuOpen = false"
          class="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200"
          :class="[
            route.path === '/ledger'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          ]"
        >
          <LineChart class="w-5 h-5" />
          <span>가계부 & 자산 추이</span>
        </NuxtLink>

        <!-- 3. 은행 통장 관리 -->
        <NuxtLink
          to="/accounts"
          @click="mobileMenuOpen = false"
          class="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200"
          :class="[
            route.path === '/accounts'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          ]"
        >
          <Building2 class="w-5 h-5" />
          <span>은행 통장 관리</span>
        </NuxtLink>

        <!-- 4. 보유 주식 관리 -->
        <NuxtLink
          to="/stocks"
          @click="mobileMenuOpen = false"
          class="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200"
          :class="[
            route.path === '/stocks'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          ]"
        >
          <TrendingUp class="w-5 h-5" />
          <span>보유 주식 관리</span>
        </NuxtLink>

        <!-- 5. 예금 & 적금 관리 -->
        <NuxtLink
          to="/savings"
          @click="mobileMenuOpen = false"
          class="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200"
          :class="[
            route.path === '/savings'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          ]"
        >
          <PiggyBank class="w-5 h-5" />
          <span>예금 & 적금 관리</span>
        </NuxtLink>

        <!-- 6. 펀드 관리 -->
        <NuxtLink
          to="/funds"
          @click="mobileMenuOpen = false"
          class="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200"
          :class="[
            route.path === '/funds'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          ]"
        >
          <Coins class="w-5 h-5" />
          <span>펀드 관리</span>
        </NuxtLink>

        <!-- 7. 부동산 자산 관리 -->
        <NuxtLink
          to="/real-estate"
          @click="mobileMenuOpen = false"
          class="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200"
          :class="[
            route.path === '/real-estate'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          ]"
        >
          <Home class="w-5 h-5" />
          <span>부동산 자산 관리</span>
        </NuxtLink>
      </nav>

      <!-- 사용자 정보 및 로그아웃 푸터 -->
      <div class="p-4 border-t border-slate-800/60">
        <div class="flex items-center justify-between p-2 rounded-xl bg-slate-800/50">
          <div class="flex items-center space-x-2.5">
            <div class="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold text-xs">
              admin
            </div>
            <span class="text-xs font-semibold text-slate-200">관리자 계정</span>
          </div>

          <button
            @click="handleLogout"
            title="로그아웃"
            class="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- 메인 컨텐츠 표시 영역 -->
    <main class="flex-1 overflow-y-auto p-4 md:p-8">
      <slot />
    </main>
  </div>
</template>

<script setup>
/**
 * 레이아웃 기본 스크립트
 * - 모바일 반응형 사이드바 드로어 토글
 * - 로그아웃 처리 (쿠키 제거 후 /login 리다이렉트)
 */
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { LayoutDashboard, LineChart, Building2, TrendingUp, PiggyBank, Coins, Home, LogOut, Menu, X } from 'lucide-vue-next'

const route = useRoute()
const mobileMenuOpen = ref(false)

const handleLogout = async () => {
  if (!confirm('로그아웃 하시겠습니까?')) return

  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
  } catch (e) {
    console.warn('Logout API failed:', e)
  }

  // 쿠키 비우기
  const cookie = useCookie('auth_token')
  cookie.value = null

  // 로그인 페이지로 이동
  await navigateTo('/login')
}
</script>
