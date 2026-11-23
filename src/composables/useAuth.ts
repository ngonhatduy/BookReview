import { computed, ref } from 'vue'
import type { User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { UserProfile } from '../types/book'

const user = ref<User | null>(null)
const profile = ref<UserProfile | null>(null)
const loading = ref<boolean>(isSupabaseConfigured)
const authError = ref<string | null>(null)
const isRecoveryMode = ref<boolean>(false)
const demoAdminEnabled = ref<boolean>(false)

let initialized = false

function translateAuthError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) {
    return 'Email hoặc mật khẩu chưa đúng.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Tài khoản chưa xác nhận email. Vui lòng kiểm tra hộp thư của bạn.'
  }
  if (lower.includes('user already registered')) {
    return 'Email này đã được đăng ký trước đó.'
  }
  if (lower.includes('password should be at least')) {
    return 'Mật khẩu phải có ít nhất 6 ký tự.'
  }
  if (lower.includes('unable to validate email')) {
    return 'Địa chỉ email không hợp lệ.'
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.'
  }
  return message
}

async function fetchProfile(userId: string): Promise<void> {
  if (!supabase) return
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, role, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.warn('Không thể tải thông tin hồ sơ:', error.message)
    return
  }

  profile.value = (data as UserProfile | null) ?? null
}

async function initAuth(): Promise<void> {
  if (initialized) return
  initialized = true

  if (!supabase) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null
    if (user.value) {
      await fetchProfile(user.value.id)
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      user.value = session?.user ?? null

      if (event === 'PASSWORD_RECOVERY') {
        isRecoveryMode.value = true
      }

      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        profile.value = null
      }
    })
  } catch (err) {
    console.error('Auth initialization error:', err)
  } finally {
    loading.value = false
  }
}

export function useAuth() {
  void initAuth()

  const isAuthenticated = computed(() => Boolean(user.value))
  const isAdmin = computed(
    () => profile.value?.role === 'admin' || (!isSupabaseConfigured && demoAdminEnabled.value),
  )

  function clearError() {
    authError.value = null
  }

  function toggleDemoAdmin(value?: boolean) {
    if (isSupabaseConfigured) return
    demoAdminEnabled.value = typeof value === 'boolean' ? value : !demoAdminEnabled.value
  }

  async function signIn(email: string, password: string): Promise<boolean> {
    if (!supabase) {
      authError.value = 'Chưa kết nối Supabase (.env).'
      return false
    }

    authError.value = null
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      authError.value = translateAuthError(error.message)
      return false
    }

    user.value = data.user
    if (data.user) {
      await fetchProfile(data.user.id)
    }
    return true
  }

  async function signUp(
    email: string,
    password: string,
    displayName: string,
  ): Promise<{ ok: boolean; needsEmailConfirmation: boolean }> {
    if (!supabase) {
      authError.value = 'Chưa kết nối Supabase (.env).'
      return { ok: false, needsEmailConfirmation: false }
    }

    authError.value = null
    const cleanName = displayName.trim()
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: cleanName || email.trim().split('@')[0],
        },
        emailRedirectTo: window.location.origin,
      },
    })

    if (error) {
      authError.value = translateAuthError(error.message)
      return { ok: false, needsEmailConfirmation: false }
    }

    const needsEmailConfirmation = !data.session && Boolean(data.user)
    if (data.session?.user) {
      user.value = data.session.user
      await fetchProfile(data.session.user.id)
    }

    return { ok: true, needsEmailConfirmation }
  }

  async function signOut(): Promise<void> {
    if (!supabase) return
    authError.value = null
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
    isRecoveryMode.value = false
  }

  async function sendPasswordReset(email: string): Promise<boolean> {
    if (!supabase) {
      authError.value = 'Chưa kết nối Supabase (.env).'
      return false
    }

    authError.value = null
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    })

    if (error) {
      authError.value = translateAuthError(error.message)
      return false
    }

    return true
  }

  async function updatePassword(newPassword: string): Promise<boolean> {
    if (!supabase) {
      authError.value = 'Chưa kết nối Supabase (.env).'
      return false
    }

    authError.value = null
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      authError.value = translateAuthError(error.message)
      return false
    }

    isRecoveryMode.value = false
    return true
  }

  return {
    user,
    profile,
    loading,
    authError,
    isAuthenticated,
    isAdmin,
    isRecoveryMode,
    demoAdminEnabled,
    isSupabaseConfigured,
    clearError,
    toggleDemoAdmin,
    signIn,
    signUp,
    signOut,
    sendPasswordReset,
    updatePassword,
  }
}
