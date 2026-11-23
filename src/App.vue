<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  AlertCircle,
  BookOpen,
  Library,
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  Star,
  UserCircle2,
} from 'lucide-vue-next'
import AuthModal from './components/AuthModal.vue'
import BookCard from './components/BookCard.vue'
import BookFormModal from './components/BookFormModal.vue'
import FilterBar from './components/FilterBar.vue'
import { useAuth } from './composables/useAuth'
import { useBooks } from './composables/useBooks'
import type { Book, BookInput, SortOption } from './types/book'

const {
  user,
  profile,
  isAuthenticated,
  isAdmin,
  isRecoveryMode,
  demoAdminEnabled,
  isSupabaseConfigured,
  toggleDemoAdmin,
} = useAuth()

const {
  books,
  loading,
  error,
  isDemoMode,
  fetchBooks,
  addBook,
  updateBook,
  deleteBook,
  resetDemoBooks,
} = useBooks()

// Filter & Sort state
const search = ref('')
const selectedGenre = ref('all')
const selectedRating = ref<number | null>(null)
const sortBy = ref<SortOption>('newest')

// Modals state
const authModalOpen = ref(false)
const bookModalOpen = ref(false)
const editingBook = ref<Book | null>(null)
const savingBook = ref(false)
const bookFormError = ref<string | null>(null)

const deletingBook = ref<Book | null>(null)
const deletingInProgress = ref(false)
const demoBannerDismissed = ref(false)

// Open Auth modal automatically when user lands from a password recovery email link
watch(isRecoveryMode, (recovery) => {
  if (recovery) {
    authModalOpen.value = true
  }
})

// Stats
const totalBooks = computed(() => books.value.length)

const averageRating = computed(() => {
  if (books.value.length === 0) return '0.0'
  const sum = books.value.reduce((acc, b) => acc + b.rating, 0)
  return (sum / books.value.length).toFixed(1)
})

const availableGenres = computed(() => {
  const set = new Set<string>()
  for (const book of books.value) {
    for (const genre of book.genres) {
      if (genre.trim()) set.add(genre.trim())
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'))
})

const hasActiveFilters = computed(
  () =>
    search.value.trim().length > 0 ||
    selectedGenre.value !== 'all' ||
    selectedRating.value !== null,
)

const filteredBooks = computed(() => {
  const query = search.value.trim().toLowerCase()

  const filtered = books.value.filter((book) => {
    if (query && !book.title.toLowerCase().includes(query)) {
      return false
    }
    if (
      selectedGenre.value !== 'all' &&
      !book.genres.some((g) => g.toLowerCase() === selectedGenre.value.toLowerCase())
    ) {
      return false
    }
    if (selectedRating.value !== null && book.rating !== selectedRating.value) {
      return false
    }
    return true
  })

  return [...filtered].sort((a, b) => {
    if (sortBy.value === 'rating_desc') {
      if (b.rating !== a.rating) return b.rating - a.rating
      return b.created_at.localeCompare(a.created_at)
    }
    if (sortBy.value === 'title_asc') {
      return a.title.localeCompare(b.title, 'vi')
    }
    // newest: books with finished_at come first sorted desc, then created_at desc
    if (a.finished_at && b.finished_at) {
      const dateCmp = b.finished_at.localeCompare(a.finished_at)
      if (dateCmp !== 0) return dateCmp
    } else if (a.finished_at && !b.finished_at) {
      return -1
    } else if (!a.finished_at && b.finished_at) {
      return 1
    }
    return b.created_at.localeCompare(a.created_at)
  })
})

const accountLabel = computed(() => {
  if (!isSupabaseConfigured) {
    return demoAdminEnabled.value ? 'Admin (Demo)' : 'Tài khoản'
  }
  if (!isAuthenticated.value) return 'Đăng nhập'
  return (
    profile.value?.display_name ||
    user.value?.email?.split('@')[0] ||
    'Tài khoản'
  )
})

function resetFilters() {
  search.value = ''
  selectedGenre.value = 'all'
  selectedRating.value = null
  sortBy.value = 'newest'
}

function openCreateModal() {
  editingBook.value = null
  bookFormError.value = null
  bookModalOpen.value = true
}

function openEditModal(book: Book) {
  editingBook.value = book
  bookFormError.value = null
  bookModalOpen.value = true
}

async function handleSaveBook(payload: BookInput) {
  savingBook.value = true
  bookFormError.value = null
  try {
    if (editingBook.value) {
      await updateBook(editingBook.value.id, payload)
    } else {
      await addBook(payload)
    }
    bookModalOpen.value = false
    editingBook.value = null
  } catch (err) {
    bookFormError.value =
      err instanceof Error ? err.message : 'Không thể lưu thông tin sách.'
  } finally {
    savingBook.value = false
  }
}

function askDeleteBook(book: Book) {
  deletingBook.value = book
}

async function confirmDeleteBook() {
  if (!deletingBook.value) return
  deletingInProgress.value = true
  try {
    await deleteBook(deletingBook.value.id)
    deletingBook.value = null
  } catch (err) {
    console.error(err)
  } finally {
    deletingInProgress.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#261f1b] text-[#efe6dc]">
    <div class="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <!-- Top Header -->
      <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div class="flex items-center gap-2.5">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-[#55473e] bg-[#342b26] text-[#e2b866] shadow-sm"
            >
              <Library class="h-5 w-5" />
            </div>
            <div>
              <h1 class="font-serif text-2xl font-bold tracking-tight text-[#f4ede4] sm:text-3xl">
                Tủ Sách Của Mình
              </h1>
              <p class="text-xs text-[#a59586]">
                Những cuốn sách đã đọc xong & đánh giá cá nhân
              </p>
            </div>
          </div>
        </div>

        <!-- Quick Stats + Account / Admin Buttons -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Stats pills -->
          <div
            class="inline-flex items-center gap-1.5 rounded-lg border border-[#473c35] bg-[#342b26] px-3 py-1.5 text-xs text-[#dfd4c8]"
          >
            <BookOpen class="h-3.5 w-3.5 text-[#c9a98d]" />
            <span><strong>{{ totalBooks }}</strong> cuốn</span>
          </div>

          <div
            class="inline-flex items-center gap-1.5 rounded-lg border border-[#473c35] bg-[#342b26] px-3 py-1.5 text-xs text-[#dfd4c8]"
          >
            <Star class="h-3.5 w-3.5 fill-[#e2b866] text-[#e2b866]" />
            <span>TB <strong>{{ averageRating }}</strong></span>
          </div>

          <!-- Quick Add Book button for Admin -->
          <button
            v-if="isAdmin"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg bg-[#e2b866] px-3 py-1.5 text-xs font-semibold text-[#241d19] transition hover:bg-[#ecc77d]"
            @click="openCreateModal"
          >
            <Plus class="h-3.5 w-3.5" />
            <span>Thêm sách</span>
          </button>

          <!-- Account Button -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-[#55473e] bg-[#342b26] px-3 py-1.5 text-xs font-medium text-[#efe6dc] transition hover:border-[#e2b866]/60 hover:bg-[#3d332d]"
            @click="authModalOpen = true"
          >
            <UserCircle2 class="h-4 w-4 text-[#e2b866]" />
            <span>{{ accountLabel }}</span>
            <span
              v-if="isAdmin && isSupabaseConfigured"
              class="rounded bg-[#e2b866]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#e2b866]"
            >
              Admin
            </span>
          </button>
        </div>
      </header>

      <!-- Demo Mode Banner (shown only when .env is not configured) -->
      <div
        v-if="isDemoMode && !demoBannerDismissed"
        class="mb-5 flex flex-col gap-3 rounded-xl border border-[#5c4b39] bg-[#312822] px-4 py-3 text-xs text-[#d6c7b8] sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex items-start gap-2.5">
          <Shield class="mt-0.5 h-4 w-4 shrink-0 text-[#e2b866]" />
          <p class="leading-relaxed">
            <strong class="text-[#efe6dc]">Chế độ xem trước (Demo cục bộ):</strong>
            Đang hiển thị 19 cuốn sách mẫu lưu tạm trên trình duyệt. Bạn có thể bật thử quyền
            Admin để thêm/sửa/xóa ngay, hoặc kết nối Supabase theo
            <code class="text-[#e2b866]">DEPLOY.md</code> khi đưa lên mạng.
          </p>
        </div>

        <div class="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            class="rounded-lg px-3 py-1.5 text-xs font-semibold transition"
            :class="
              demoAdminEnabled
                ? 'bg-[#e2b866] text-[#241d19]'
                : 'border border-[#5d4e43] bg-[#3d332d] text-[#efe6dc] hover:border-[#e2b866]/60'
            "
            @click="toggleDemoAdmin()"
          >
            {{ demoAdminEnabled ? 'Đang bật Admin Demo' : 'Bật thử chế độ Admin (Demo)' }}
          </button>
          <button
            v-if="demoAdminEnabled"
            type="button"
            title="Khôi phục 19 cuốn sách mẫu ban đầu"
            class="inline-flex items-center gap-1 rounded-lg border border-[#4b3f37] px-2.5 py-1.5 text-xs text-[#b5a698] hover:text-[#efe6dc]"
            @click="resetDemoBooks"
          >
            <RefreshCw class="h-3 w-3" />
            <span>Đặt lại mẫu</span>
          </button>
          <button
            type="button"
            class="rounded-lg px-2 py-1 text-xs text-[#9b8c7e] hover:text-[#efe6dc]"
            @click="demoBannerDismissed = true"
          >
            Ẩn
          </button>
        </div>
      </div>

      <!-- Filter Bar -->
      <FilterBar
        v-model:search="search"
        v-model:selected-genre="selectedGenre"
        v-model:selected-rating="selectedRating"
        v-model:sort-by="sortBy"
        :available-genres="availableGenres"
        :has-active-filters="hasActiveFilters"
        :total-filtered="filteredBooks.length"
        :total-books="totalBooks"
        @reset="resetFilters"
      />

      <!-- Error State -->
      <div
        v-if="error"
        class="mb-6 flex flex-col items-start justify-between gap-3 rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-200 sm:flex-row sm:items-center"
      >
        <div class="flex items-center gap-2">
          <AlertCircle class="h-4 w-4 shrink-0 text-red-400" />
          <span>{{ error }}</span>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-red-400/40 px-3 py-1.5 text-xs font-medium hover:bg-red-900/40"
          @click="fetchBooks"
        >
          <RefreshCw class="h-3.5 w-3.5" />
          <span>Thử lại</span>
        </button>
      </div>

      <!-- Loading Skeleton Grid -->
      <div
        v-if="loading"
        class="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7"
      >
        <div
          v-for="idx in 14"
          :key="idx"
          class="h-64 animate-pulse rounded-xl border border-[#473c35] bg-[#342b26]/60 p-3"
        >
          <div class="mx-auto mb-3 aspect-[2/3] w-24 rounded bg-[#423730]" />
          <div class="mb-2 h-3.5 w-4/5 rounded bg-[#423730]" />
          <div class="mb-2 h-3 w-3/5 rounded bg-[#423730]" />
          <div class="mt-auto h-3 w-20 rounded bg-[#423730]" />
        </div>
      </div>

      <!-- Empty Filter Result -->
      <div
        v-else-if="filteredBooks.length === 0 && (hasActiveFilters || !isAdmin)"
        class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#4b3f37] bg-[#2e2621]/50 py-16 text-center"
      >
        <BookOpen class="mb-3 h-10 w-10 text-[#7f7063]" />
        <p class="font-serif text-base text-[#efe6dc]">
          {{ hasActiveFilters ? 'Không tìm thấy cuốn sách phù hợp' : 'Tủ sách đang trống' }}
        </p>
        <p class="mt-1 text-xs text-[#9b8c7e]">
          {{
            hasActiveFilters
              ? 'Thử đổi từ khóa, thể loại hoặc số sao khác nhé.'
              : 'Hãy đăng nhập tài khoản Admin để thêm cuốn sách đầu tiên.'
          }}
        </p>
        <button
          v-if="hasActiveFilters"
          type="button"
          class="mt-4 rounded-lg border border-[#5a4c42] bg-[#3a302a] px-4 py-1.5 text-xs font-medium text-[#efe6dc] hover:border-[#e2b866]/60"
          @click="resetFilters"
        >
          Xóa tất cả bộ lọc
        </button>
      </div>

      <!-- Book Gallery Grid (7 columns on wide desktop like Notion screenshot) -->
      <main
        v-else
        class="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7"
      >
        <BookCard
          v-for="book in filteredBooks"
          :key="book.id"
          :book="book"
          :is-admin="isAdmin"
          @edit="openEditModal"
          @delete="askDeleteBook"
        />

        <!-- Notion-style "+ Thêm sách mới" ghost card for Admin -->
        <button
          v-if="isAdmin"
          type="button"
          class="flex min-h-[245px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#52453d] bg-[#2d2520]/55 p-4 text-sm font-medium text-[#9e8e80] transition hover:border-[#e2b866]/60 hover:bg-[#362c27] hover:text-[#e2b866]"
          @click="openCreateModal"
        >
          <Plus class="h-5 w-5" />
          <span>Thêm sách mới</span>
        </button>
      </main>
    </div>

    <!-- Add / Edit Book Modal -->
    <BookFormModal
      :open="bookModalOpen"
      :book="editingBook"
      :saving="savingBook"
      :error-message="bookFormError"
      @close="bookModalOpen = false"
      @submit="handleSaveBook"
    />

    <!-- Account Modal -->
    <AuthModal :open="authModalOpen" @close="authModalOpen = false" />

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="deletingBook"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        @click.self="deletingBook = null"
      >
        <div class="w-full max-w-sm rounded-2xl border border-[#4e4139] bg-[#2e2621] p-5 shadow-2xl">
          <h3 class="font-serif text-base font-semibold text-[#efe6dc]">
            Xác nhận xóa sách
          </h3>
          <p class="mt-2 text-xs leading-relaxed text-[#cbbdb0]">
            Bạn có chắc chắn muốn xóa cuốn
            <strong class="text-[#efe6dc]">"{{ deletingBook.title }}"</strong>
            khỏi tủ sách không? Thao tác này không thể hoàn tác.
          </p>
          <div class="mt-5 flex justify-end gap-2">
            <button
              type="button"
              :disabled="deletingInProgress"
              class="rounded-lg border border-[#4b3f37] px-3.5 py-1.5 text-xs font-medium text-[#cbbdb0] hover:bg-[#3a302a]"
              @click="deletingBook = null"
            >
              Hủy
            </button>
            <button
              type="button"
              :disabled="deletingInProgress"
              class="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
              @click="confirmDeleteBook"
            >
              <Loader2 v-if="deletingInProgress" class="h-3.5 w-3.5 animate-spin" />
              <span>Xóa sách</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
