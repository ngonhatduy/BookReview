<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ImagePlus, Link2, Loader2, Plus, ShoppingBag, Trash2, X } from 'lucide-vue-next'
import { useBooks } from '../composables/useBooks'
import { PRESET_GENRES } from '../data/genres'
import type { Book, BookInput } from '../types/book'
import StarRating from './StarRating.vue'

const props = defineProps<{
  open: boolean
  book: Book | null
  saving: boolean
  errorMessage: string | null
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: BookInput]
}>()

const { uploadCover } = useBooks()

const title = ref('')
const coverUrl = ref('')
const genres = ref<string[]>([])
const customGenre = ref('')
const rating = ref(5)
const finishedAt = ref('')
const shopeeUrl = ref('')
const localError = ref<string | null>(null)
const uploadingCover = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const isEditing = computed(() => Boolean(props.book))

watch(
  () => [props.open, props.book] as const,
  ([isOpen, currentBook]) => {
    if (!isOpen) return
    localError.value = null
    if (currentBook) {
      title.value = currentBook.title
      coverUrl.value = currentBook.cover_url ?? ''
      genres.value = [...currentBook.genres]
      rating.value = currentBook.rating
      finishedAt.value = currentBook.finished_at ?? ''
      shopeeUrl.value = currentBook.shopee_url ?? ''
    } else {
      title.value = ''
      coverUrl.value = ''
      genres.value = []
      rating.value = 5
      finishedAt.value = ''
      shopeeUrl.value = ''
    }
    customGenre.value = ''
  },
  { immediate: true },
)

function toggleGenre(name: string) {
  const exists = genres.value.some((g) => g.toLowerCase() === name.toLowerCase())
  if (exists) {
    genres.value = genres.value.filter((g) => g.toLowerCase() !== name.toLowerCase())
  } else {
    genres.value = [...genres.value, name]
  }
}

function addCustomGenre() {
  const cleaned = customGenre.value.trim()
  if (!cleaned) return
  if (!genres.value.some((g) => g.toLowerCase() === cleaned.toLowerCase())) {
    genres.value = [...genres.value, cleaned]
  }
  customGenre.value = ''
}

function isGenreSelected(name: string): boolean {
  return genres.value.some((g) => g.toLowerCase() === name.toLowerCase())
}

const extraGenres = computed(() =>
  genres.value.filter(
    (g) => !PRESET_GENRES.some((preset) => preset.name.toLowerCase() === g.toLowerCase()),
  ),
)

async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  localError.value = null
  uploadingCover.value = true
  try {
    const publicUrl = await uploadCover(file)
    coverUrl.value = publicUrl
  } catch (err) {
    localError.value =
      err instanceof Error ? err.message : 'Không thể tải ảnh bìa lên.'
  } finally {
    uploadingCover.value = false
    input.value = ''
  }
}

function handleSubmit() {
  localError.value = null
  if (!title.value.trim()) {
    localError.value = 'Vui lòng nhập tên sách.'
    return
  }
  if (rating.value < 1 || rating.value > 5) {
    localError.value = 'Đánh giá phải từ 1 đến 5 sao.'
    return
  }
  const cleanedShopeeUrl = shopeeUrl.value.trim()
  if (cleanedShopeeUrl && !/^https?:\/\//i.test(cleanedShopeeUrl)) {
    localError.value = 'Link Shopee phải bắt đầu bằng http:// hoặc https://'
    return
  }

  emit('submit', {
    title: title.value.trim(),
    cover_url: coverUrl.value.trim() || null,
    genres: genres.value,
    rating: rating.value,
    finished_at: finishedAt.value.trim() || null,
    shopee_url: cleanedShopeeUrl || null,
  })
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
        class="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#4e4139] bg-[#2e2621] p-5 shadow-2xl"
      >
        <div class="mb-4 flex items-center justify-between border-b border-[#443831] pb-3">
          <h2 class="font-serif text-lg font-semibold text-[#efe6dc]">
            {{ isEditing ? 'Chỉnh sửa sách' : 'Thêm sách mới' }}
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

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <!-- Title -->
          <div>
            <label class="mb-1.5 block text-xs font-medium text-[#cbbdb0]">
              Tên sách <span class="text-[#e2b866]">*</span>
            </label>
            <input
              v-model="title"
              type="text"
              required
              placeholder="Ví dụ: Thư Viện Nửa Đêm"
              class="w-full rounded-lg border border-[#4b3f37] bg-[#241d19] px-3 py-2 text-sm text-[#efe6dc] placeholder-[#7f7063] focus:border-[#e2b866]/70 focus:outline-none"
            />
          </div>

          <!-- Cover Upload + URL + Preview -->
          <div>
            <label class="mb-1.5 block text-xs font-medium text-[#cbbdb0]">
              Ảnh bìa sách
            </label>
            <div class="flex gap-3">
              <div
                class="flex aspect-[2/3] w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#4b3f37] bg-[#241d19]"
              >
                <img
                  v-if="coverUrl"
                  :src="coverUrl"
                  alt="Xem trước bìa"
                  class="h-full w-full object-cover"
                />
                <span v-else class="px-1 text-center text-[10px] text-[#7f7063]">
                  Chưa có ảnh
                </span>
              </div>

              <div class="flex flex-1 flex-col justify-between gap-2">
                <div class="flex flex-wrap items-center gap-2">
                  <input
                    ref="fileInputRef"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleFileSelect"
                  />
                  <button
                    type="button"
                    :disabled="uploadingCover"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-[#5a4c42] bg-[#3a302a] px-3 py-1.5 text-xs font-medium text-[#efe6dc] transition hover:border-[#e2b866]/60 disabled:opacity-60"
                    @click="fileInputRef?.click()"
                  >
                    <Loader2 v-if="uploadingCover" class="h-3.5 w-3.5 animate-spin" />
                    <ImagePlus v-else class="h-3.5 w-3.5 text-[#e2b866]" />
                    <span>{{ uploadingCover ? 'Đang tải lên...' : 'Tải ảnh từ máy' }}</span>
                  </button>

                  <button
                    v-if="coverUrl"
                    type="button"
                    class="inline-flex items-center gap-1 rounded-lg border border-[#4b3f37] px-2.5 py-1.5 text-xs text-[#b5a698] transition hover:border-red-400/50 hover:text-red-300"
                    @click="coverUrl = ''"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                    <span>Xóa ảnh</span>
                  </button>
                </div>

                <div class="relative">
                  <Link2
                    class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7f7063]"
                  />
                  <input
                    v-model="coverUrl"
                    type="url"
                    placeholder="Hoặc dán URL ảnh bìa (https://...)"
                    class="w-full rounded-lg border border-[#4b3f37] bg-[#241d19] py-1.5 pl-8 pr-3 text-xs text-[#efe6dc] placeholder-[#7f7063] focus:border-[#e2b866]/70 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Star Rating -->
          <div>
            <label class="mb-1.5 block text-xs font-medium text-[#cbbdb0]">
              Đánh giá của bạn (1–5 sao)
            </label>
            <div class="flex items-center gap-3 rounded-lg border border-[#4b3f37] bg-[#241d19] px-3 py-2">
              <StarRating v-model="rating" :readonly="false" size="lg" />
              <span class="text-sm font-medium text-[#e2b866]">
                {{ rating }} / 5 sao
              </span>
            </div>
          </div>

          <!-- Genres -->
          <div>
            <label class="mb-1.5 block text-xs font-medium text-[#cbbdb0]">
              Thể loại
            </label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="preset in PRESET_GENRES"
                :key="preset.name"
                type="button"
                class="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition"
                :class="
                  isGenreSelected(preset.name)
                    ? 'border-[#e2b866]/70 bg-[#e2b866]/15 text-[#f2d492]'
                    : 'border-[#4b3f37] bg-[#241d19] text-[#b5a698] hover:border-[#66564c]'
                "
                @click="toggleGenre(preset.name)"
              >
                <component :is="preset.icon" class="h-3 w-3" :class="preset.iconClass" />
                <span>{{ preset.name }}</span>
              </button>

              <button
                v-for="custom in extraGenres"
                :key="custom"
                type="button"
                class="inline-flex items-center gap-1 rounded-md border border-[#e2b866]/70 bg-[#e2b866]/15 px-2 py-1 text-xs text-[#f2d492]"
                @click="toggleGenre(custom)"
              >
                <span>{{ custom }}</span>
                <X class="h-3 w-3" />
              </button>
            </div>

            <div class="mt-2 flex gap-2">
              <input
                v-model="customGenre"
                type="text"
                placeholder="Thêm thể loại khác..."
                class="flex-1 rounded-lg border border-[#4b3f37] bg-[#241d19] px-3 py-1.5 text-xs text-[#efe6dc] placeholder-[#7f7063] focus:border-[#e2b866]/70 focus:outline-none"
                @keydown.enter.prevent="addCustomGenre"
              />
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded-lg border border-[#5a4c42] bg-[#3a302a] px-3 py-1.5 text-xs font-medium text-[#efe6dc] transition hover:border-[#e2b866]/60"
                @click="addCustomGenre"
              >
                <Plus class="h-3.5 w-3.5" />
                <span>Thêm</span>
              </button>
            </div>
          </div>

          <!-- Finished Date -->
          <div>
            <label class="mb-1.5 block text-xs font-medium text-[#cbbdb0]">
              Ngày đọc xong (tùy chọn)
            </label>
            <input
              v-model="finishedAt"
              type="date"
              class="w-full rounded-lg border border-[#4b3f37] bg-[#241d19] px-3 py-2 text-sm text-[#efe6dc] focus:border-[#e2b866]/70 focus:outline-none"
            />
          </div>

          <!-- Shopee URL -->
          <div>
            <label class="mb-1.5 block text-xs font-medium text-[#cbbdb0]">
              Link Shopee (tùy chọn)
            </label>
            <div class="relative">
              <ShoppingBag
                class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ee4d2d]"
              />
              <input
                v-model="shopeeUrl"
                type="url"
                placeholder="https://shopee.vn/... hoặc https://s.shopee.vn/..."
                class="w-full rounded-lg border border-[#4b3f37] bg-[#241d19] py-2 pl-9 pr-3 text-sm text-[#efe6dc] placeholder-[#7f7063] focus:border-[#e2b866]/70 focus:outline-none"
              />
            </div>
            <p class="mt-1 text-[11px] text-[#8b7c6f]">
              Khi người xem bấm vào thẻ sách sẽ chuyển sang link Shopee này.
            </p>
          </div>

          <!-- Error notice -->
          <div
            v-if="localError || errorMessage"
            class="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200"
          >
            {{ localError || errorMessage }}
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-2.5 border-t border-[#443831] pt-3">
            <button
              type="button"
              class="rounded-lg border border-[#4b3f37] px-4 py-2 text-xs font-medium text-[#cbbdb0] transition hover:bg-[#3a302a]"
              @click="emit('close')"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="saving || uploadingCover"
              class="inline-flex items-center gap-1.5 rounded-lg bg-[#e2b866] px-4 py-2 text-xs font-semibold text-[#241d19] transition hover:bg-[#ecc77d] disabled:opacity-60"
            >
              <Loader2 v-if="saving" class="h-3.5 w-3.5 animate-spin" />
              <span>{{ isEditing ? 'Lưu thay đổi' : 'Thêm vào tủ sách' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
