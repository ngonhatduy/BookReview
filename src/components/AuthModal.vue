<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  X,
} from 'lucide-vue-next'
import { useAuth } from '../composables/useAuth'

type AuthMode = 'signin' | 'signup' | 'forgot' | 'change_password' | 'account'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const {
  user,
  profile,
  authError,
  isAuthenticated,
  isAdmin,
  isRecoveryMode,
  isSupabaseConfigured,
  demoAdminEnabled,
  clearError,
  toggleDemoAdmin,
  signIn,
  signUp,
  signOut,
  sendPasswordReset,
  updatePassword,
} = useAuth()

const mode = ref<AuthMode>('signin')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const displayName = ref('')
const showPassword = ref(false)
const submitting = ref(false)
const localError = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const displayEmail = computed(() => profile.value?.email ?? user.value?.email ?? '')
const displayTitle = computed(
  () =>
    profile.value?.display_name ??
    (user.value?.user_metadata?.display_name as string | undefined) ??
    displayEmail.value.split('@')[0] ??
    'Người dùng',
)

function resetMessages() {
  localError.value = null
  successMessage.value = null
  clearError()
}

function switchMode(nextMode: AuthMode) {
  resetMessages()
  password.value = ''
  confirmPassword.value = ''
  mode.value = nextMode
}

watch(
  () => [props.open, isAuthenticated.value, isRecoveryMode.value] as const,
  ([isOpen, authed, recovery]) => {
    if (!isOpen) return
    resetMessages()
    if (recovery) {
      mode.value = 'change_password'
    } else if (authed) {
      mode.value = 'account'
    } else {
      mode.value = 'signin'
    }
  },
  { immediate: true },
)

async function handleSignIn() {
  resetMessages()
  if (!email.value.trim() || !password.value) {
    localError.value = 'Vui lòng nhập email và mật khẩu.'
    return
  }
  submitting.value = true
  try {
    const ok = await signIn(email.value, password.value)
    if (ok) {
      emit('close')
    }
  } finally {
    submitting.value = false
  }
}

async function handleSignUp() {
  resetMessages()
  if (!email.value.trim() || !password.value) {
    localError.value = 'Vui lòng nhập đầy đủ email và mật khẩu.'
    return
  }
  if (password.value.length < 6) {
    localError.value = 'Mật khẩu phải có ít nhất 6 ký tự.'
    return
  }
  if (password.value !== confirmPassword.value) {
    localError.value = 'Mật khẩu xác nhận không khớp.'
    return
  }

  submitting.value = true
  try {
    const res = await signUp(email.value, password.value, displayName.value)
    if (!res.ok) return
    if (res.needsEmailConfirmation) {
      successMessage.value =
        'Đăng ký thành công! Vui lòng kiểm tra hộp thư để xác nhận email trước khi đăng nhập.'
      mode.value = 'signin'
      password.value = ''
      confirmPassword.value = ''
    } else {
      emit('close')
    }
  } finally {
    submitting.value = false
  }
}

async function handleForgot() {
  resetMessages()
  if (!email.value.trim()) {
    localError.value = 'Vui lòng nhập địa chỉ email đã đăng ký.'
    return
  }
  submitting.value = true
  try {
    const ok = await sendPasswordReset(email.value)
    if (ok) {
      successMessage.value =
        'Đã gửi liên kết đặt lại mật khẩu! Vui lòng kiểm tra email của bạn.'
    }
  } finally {
    submitting.value = false
  }
}

async function handleChangePassword() {
  resetMessages()
  if (password.value.length < 6) {
    localError.value = 'Mật khẩu mới phải có ít nhất 6 ký tự.'
    return
  }
  if (password.value !== confirmPassword.value) {
    localError.value = 'Mật khẩu xác nhận không khớp.'
    return
  }
  submitting.value = true
  try {
    const ok = await updatePassword(password.value)
    if (ok) {
      successMessage.value = 'Cập nhật mật khẩu thành công!'
      password.value = ''
      confirmPassword.value = ''
      mode.value = 'account'
    }
  } finally {
    submitting.value = false
  }
}

async function handleSignOut() {
  submitting.value = true
  try {
    await signOut()
    mode.value = 'signin'
    emit('close')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div
        class="w-full max-w-md rounded-2xl border border-[#4e4139] bg-[#2e2621] p-5 shadow-2xl"
      >
        <!-- Header -->
        <div class="mb-4 flex items-center justify-between border-b border-[#443831] pb-3">
          <h2 class="font-serif text-lg font-semibold text-[#efe6dc]">
            <template v-if="mode === 'signin'">Đăng nhập tài khoản</template>
            <template v-else-if="mode === 'signup'">Tạo tài khoản mới</template>
            <template v-else-if="mode === 'forgot'">Quên mật khẩu</template>
            <template v-else-if="mode === 'change_password'">
              {{ isRecoveryMode ? 'Đặt lại mật khẩu mới' : 'Đổi mật khẩu' }}
            </template>
            <template v-else>Tài khoản của bạn</template>
          </h2>
          <button
            type="button"
            aria-label="Đóng"
            class="rounded-lg p-1.5 text-[#9e8e80] transition hover:bg-[#3d332d] hover:text-[#efe6dc]"
            @click="emit('close')"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Notice when Supabase .env is not configured yet -->
        <div
          v-if="!isSupabaseConfigured"
          class="space-y-3 rounded-xl border border-[#5a4a3a] bg-[#261f1b] p-4 text-xs leading-relaxed text-[#cbbdb0]"
        >
          <p class="font-medium text-[#e2b866]">
            Chưa kết nối Supabase Auth (.env)
          </p>
          <p>
            Trang web đang chạy ở <strong>Chế độ Demo cục bộ</strong>. Để bật đăng ký,
            đăng nhập, quên mật khẩu và phân quyền Admin thật, bạn cần tạo dự án
            Supabase miễn phí và điền <code class="text-[#efe6dc]">VITE_SUPABASE_URL</code>
            + <code class="text-[#efe6dc]">VITE_SUPABASE_ANON_KEY</code> theo hướng dẫn
            trong file <code class="text-[#efe6dc]">DEPLOY.md</code>.
          </p>
          <div class="flex items-center justify-between border-t border-[#443831] pt-3">
            <span>Thử quyền Admin ngay (Demo):</span>
            <button
              type="button"
              class="rounded-lg px-3 py-1.5 font-semibold transition"
              :class="
                demoAdminEnabled
                  ? 'bg-[#e2b866] text-[#241d19]'
                  : 'border border-[#5a4c42] bg-[#3a302a] text-[#efe6dc] hover:border-[#e2b866]/60'
              "
              @click="toggleDemoAdmin()"
            >
              {{ demoAdminEnabled ? 'Đang bật Admin Demo' : 'Bật Admin Demo' }}
            </button>
          </div>
        </div>

        <!-- Real Supabase Auth UI -->
        <template v-else>
          <!-- Tabs for Sign In / Sign Up when unauthenticated -->
          <div
            v-if="mode === 'signin' || mode === 'signup'"
            class="mb-4 grid grid-cols-2 rounded-lg border border-[#473c35] bg-[#241d19] p-1"
          >
            <button
              type="button"
              class="rounded-md py-1.5 text-xs font-medium transition"
              :class="
                mode === 'signin'
                  ? 'bg-[#3d332d] text-[#efe6dc] shadow'
                  : 'text-[#9e8e80] hover:text-[#efe6dc]'
              "
              @click="switchMode('signin')"
            >
              Đăng nhập
            </button>
            <button
              type="button"
              class="rounded-md py-1.5 text-xs font-medium transition"
              :class="
                mode === 'signup'
                  ? 'bg-[#3d332d] text-[#efe6dc] shadow'
                  : 'text-[#9e8e80] hover:text-[#efe6dc]'
              "
              @click="switchMode('signup')"
            >
              Đăng ký
            </button>
          </div>

          <!-- Success message -->
          <div
            v-if="successMessage"
            class="mb-3 flex items-start gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-200"
          >
            <CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <span>{{ successMessage }}</span>
          </div>

          <!-- Error message -->
          <div
            v-if="localError || authError"
            class="mb-3 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200"
          >
            {{ localError || authError }}
          </div>

          <!-- SIGN IN FORM -->
          <form v-if="mode === 'signin'" class="space-y-3.5" @submit.prevent="handleSignIn">
            <div>
              <label class="mb-1 block text-xs font-medium text-[#cbbdb0]">Email</label>
              <input
                v-model="email"
                type="email"
                required
                autocomplete="email"
                placeholder="ban@example.com"
                class="w-full rounded-lg border border-[#4b3f37] bg-[#241d19] px-3 py-2 text-sm text-[#efe6dc] placeholder-[#7f7063] focus:border-[#e2b866]/70 focus:outline-none"
              />
            </div>

            <div>
              <div class="mb-1 flex items-center justify-between">
                <label class="text-xs font-medium text-[#cbbdb0]">Mật khẩu</label>
                <button
                  type="button"
                  class="text-[11px] text-[#e2b866] hover:underline"
                  @click="switchMode('forgot')"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div class="relative">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  autocomplete="current-password"
                  placeholder="••••••••"
                  class="w-full rounded-lg border border-[#4b3f37] bg-[#241d19] py-2 pl-3 pr-9 text-sm text-[#efe6dc] placeholder-[#7f7063] focus:border-[#e2b866]/70 focus:outline-none"
                />
                <button
                  type="button"
                  aria-label="Hiện hoặc ẩn mật khẩu"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b7c6f] hover:text-[#efe6dc]"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" class="h-4 w-4" />
                  <Eye v-else class="h-4 w-4" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              :disabled="submitting"
              class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e2b866] py-2 text-sm font-semibold text-[#241d19] transition hover:bg-[#ecc77d] disabled:opacity-60"
            >
              <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
              <span>Đăng nhập</span>
            </button>
          </form>

          <!-- SIGN UP FORM -->
          <form v-else-if="mode === 'signup'" class="space-y-3.5" @submit.prevent="handleSignUp">
            <p class="rounded-lg border border-[#473c35] bg-[#261f1b] px-3 py-2 text-[11px] text-[#b5a698]">
              Tài khoản đầu tiên đăng ký trên web sẽ tự động nhận quyền
              <strong class="text-[#e2b866]">Admin</strong> để quản lý tủ sách.
            </p>

            <div>
              <label class="mb-1 block text-xs font-medium text-[#cbbdb0]">Tên hiển thị</label>
              <input
                v-model="displayName"
                type="text"
                placeholder="Ví dụ: Ngoc Tran"
                class="w-full rounded-lg border border-[#4b3f37] bg-[#241d19] px-3 py-2 text-sm text-[#efe6dc] placeholder-[#7f7063] focus:border-[#e2b866]/70 focus:outline-none"
              />
            </div>

            <div>
              <label class="mb-1 block text-xs font-medium text-[#cbbdb0]">Email</label>
              <input
                v-model="email"
                type="email"
                required
                autocomplete="email"
                placeholder="ban@example.com"
                class="w-full rounded-lg border border-[#4b3f37] bg-[#241d19] px-3 py-2 text-sm text-[#efe6dc] placeholder-[#7f7063] focus:border-[#e2b866]/70 focus:outline-none"
              />
            </div>

            <div>
              <label class="mb-1 block text-xs font-medium text-[#cbbdb0]">Mật khẩu</label>
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                minlength="6"
                autocomplete="new-password"
                placeholder="Ít nhất 6 ký tự"
                class="w-full rounded-lg border border-[#4b3f37] bg-[#241d19] px-3 py-2 text-sm text-[#efe6dc] placeholder-[#7f7063] focus:border-[#e2b866]/70 focus:outline-none"
              />
            </div>

            <div>
              <label class="mb-1 block text-xs font-medium text-[#cbbdb0]">Xác nhận mật khẩu</label>
              <input
                v-model="confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="new-password"
                placeholder="Nhập lại mật khẩu"
                class="w-full rounded-lg border border-[#4b3f37] bg-[#241d19] px-3 py-2 text-sm text-[#efe6dc] placeholder-[#7f7063] focus:border-[#e2b866]/70 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              :disabled="submitting"
              class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e2b866] py-2 text-sm font-semibold text-[#241d19] transition hover:bg-[#ecc77d] disabled:opacity-60"
            >
              <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
              <span>Tạo tài khoản</span>
            </button>
          </form>

          <!-- FORGOT PASSWORD FORM -->
          <form v-else-if="mode === 'forgot'" class="space-y-3.5" @submit.prevent="handleForgot">
            <p class="text-xs text-[#b5a698]">
              Nhập email tài khoản của bạn. Hệ thống sẽ gửi một đường dẫn để đặt lại mật khẩu mới.
            </p>
            <div>
              <label class="mb-1 block text-xs font-medium text-[#cbbdb0]">Email</label>
              <input
                v-model="email"
                type="email"
                required
                placeholder="ban@example.com"
                class="w-full rounded-lg border border-[#4b3f37] bg-[#241d19] px-3 py-2 text-sm text-[#efe6dc] placeholder-[#7f7063] focus:border-[#e2b866]/70 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              :disabled="submitting"
              class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e2b866] py-2 text-sm font-semibold text-[#241d19] transition hover:bg-[#ecc77d] disabled:opacity-60"
            >
              <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
              <span>Gửi email đặt lại mật khẩu</span>
            </button>
            <button
              type="button"
              class="w-full text-center text-xs text-[#b5a698] hover:text-[#efe6dc]"
              @click="switchMode('signin')"
            >
              ← Quay lại đăng nhập
            </button>
          </form>

          <!-- CHANGE / RESET PASSWORD FORM -->
          <form
            v-else-if="mode === 'change_password'"
            class="space-y-3.5"
            @submit.prevent="handleChangePassword"
          >
            <div>
              <label class="mb-1 block text-xs font-medium text-[#cbbdb0]">Mật khẩu mới</label>
              <input
                v-model="password"
                type="password"
                required
                minlength="6"
                placeholder="Ít nhất 6 ký tự"
                class="w-full rounded-lg border border-[#4b3f37] bg-[#241d19] px-3 py-2 text-sm text-[#efe6dc] placeholder-[#7f7063] focus:border-[#e2b866]/70 focus:outline-none"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-[#cbbdb0]">
                Xác nhận mật khẩu mới
              </label>
              <input
                v-model="confirmPassword"
                type="password"
                required
                placeholder="Nhập lại mật khẩu mới"
                class="w-full rounded-lg border border-[#4b3f37] bg-[#241d19] px-3 py-2 text-sm text-[#efe6dc] placeholder-[#7f7063] focus:border-[#e2b866]/70 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              :disabled="submitting"
              class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e2b866] py-2 text-sm font-semibold text-[#241d19] transition hover:bg-[#ecc77d] disabled:opacity-60"
            >
              <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
              <span>Lưu mật khẩu mới</span>
            </button>
            <button
              v-if="isAuthenticated && !isRecoveryMode"
              type="button"
              class="w-full text-center text-xs text-[#b5a698] hover:text-[#efe6dc]"
              @click="switchMode('account')"
            >
              ← Quay lại thông tin tài khoản
            </button>
          </form>

          <!-- ACCOUNT PROFILE PANEL -->
          <div v-else class="space-y-4">
            <div class="flex items-center gap-3 rounded-xl border border-[#473c35] bg-[#261f1b] p-3.5">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3d332d] text-[#e2b866]"
              >
                <ShieldCheck v-if="isAdmin" class="h-5 w-5" />
                <UserIcon v-else class="h-5 w-5" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="truncate text-sm font-semibold text-[#efe6dc]">
                    {{ displayTitle }}
                  </p>
                  <span
                    class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    :class="
                      isAdmin
                        ? 'bg-[#e2b866]/20 text-[#e2b866] border border-[#e2b866]/40'
                        : 'bg-[#3d332d] text-[#b5a698] border border-[#54463d]'
                    "
                  >
                    {{ isAdmin ? 'Admin' : 'Khách' }}
                  </span>
                </div>
                <p class="truncate text-xs text-[#9b8c7e]">{{ displayEmail }}</p>
              </div>
            </div>

            <p v-if="!isAdmin" class="text-xs leading-relaxed text-[#b5a698]">
              Tài khoản của bạn đang ở quyền <strong>Khách</strong> (chỉ xem). Chỉ tài
              khoản có quyền <strong>Admin</strong> mới có thể thêm, sửa hoặc xóa sách.
            </p>

            <div class="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#5a4c42] bg-[#3a302a] px-3 py-2 text-xs font-medium text-[#efe6dc] transition hover:border-[#e2b866]/60"
                @click="switchMode('change_password')"
              >
                <KeyRound class="h-3.5 w-3.5" />
                <span>Đổi mật khẩu</span>
              </button>

              <button
                type="button"
                :disabled="submitting"
                class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-950/50"
                @click="handleSignOut"
              >
                <LogOut class="h-3.5 w-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>
