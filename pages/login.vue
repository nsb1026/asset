<template>
  <div class="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
    <!-- 배경 은은한 그라데이션 원형 블러 효과 -->
    <div class="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
    <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>

    <!-- 로그인 카드 컨테이너 -->
    <div class="w-full max-w-md glass-card p-8 bg-slate-900/90 border border-slate-800 shadow-2xl relative z-10 rounded-2xl">
      <!-- 헤더 로고 및 설명 -->
      <div class="text-center mb-8">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-black text-2xl text-white mx-auto mb-3 shadow-lg shadow-indigo-500/30">
          ₩
        </div>
        <h1 class="text-2xl font-bold text-white tracking-tight">자산 관리 시스템 로그인</h1>
        <p class="text-xs text-slate-400 mt-1">계정 정보를 입력하여 대시보드에 접속하세요.</p>
      </div>

      <!-- 로그인 폼 -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">사용자 아이디 (ID)</label>
          <div class="relative">
            <input
              v-model="username"
              type="text"
              placeholder="아이디 입력"
              required
              class="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
            />
            <User class="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">비밀번호 (Password)</label>
          <div class="relative">
            <input
              v-model="password"
              type="password"
              placeholder="비밀번호 입력"
              required
              class="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
            />
            <Lock class="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          </div>
        </div>

        <!-- 에러 메시지 노출 -->
        <div v-if="errorMessage" class="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
          ⚠️ {{ errorMessage }}
        </div>

        <!-- 제출 버튼 -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3.5 rounded-xl btn-primary text-sm font-semibold flex items-center justify-center space-x-2 mt-6 shadow-lg shadow-indigo-600/30"
        >
          <LogIn class="w-4 h-4" />
          <span>{{ loading ? '로그인 처리 중...' : '로그인 하기' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
/**
 * 로그인 인증 컴포넌트 (pages/login.vue)
 * - 사용자 아이디 및 비밀번호 수동 입력 받아 /api/auth/login 통신
 * - 성공 시 메인 대시보드(/)로 이동
 */
import { ref } from 'vue'
import { User, Lock, LogIn } from 'lucide-vue-next'

definePageMeta({
  layout: false // 로그인 페이지는 메인 사이드바 레이아웃 제외
})

// 입력 폼 초기값을 빈 문자열로 설정하여 직접 타이핑하도록 변경
const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  if (!username.value || !password.value) return

  loading.value = true
  errorMessage.value = ''

  try {
    const res = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        username: username.value,
        password: password.value
      }
    })

    if (res.success) {
      // 인증 쿠키 갱신
      const cookie = useCookie('auth_token')
      cookie.value = 'admin_authenticated_session_token'

      // 대시보드로 이동
      await navigateTo('/')
    } else {
      errorMessage.value = res.message || '로그인 실패'
    }
  } catch (err) {
    errorMessage.value = err.data?.statusMessage || err.message || '아이디 또는 비밀번호가 올바르지 않습니다.'
  } finally {
    loading.value = false
  }
}
</script>
