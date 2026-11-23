<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { FileText, Pencil, Trash2 } from 'lucide-vue-next'
import { getGenreMeta } from '../data/genres'
import type { Book } from '../types/book'
import StarRating from './StarRating.vue'

const props = defineProps<{
  book: Book
  isAdmin: boolean
}>()

const emit = defineEmits<{
  edit: [book: Book]
  delete: [book: Book]
}>()

const imageError = ref(false)

watch(
  () => props.book.cover_url,
  () => {
    imageError.value = false
  },
)

const genreItems = computed(() => props.book.genres.map((g) => getGenreMeta(g)))

const formattedDate = computed(() => {
  if (!props.book.finished_at) return null
  const parts = props.book.finished_at.split('-').map(Number)
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return props.book.finished_at
  }
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
})

const COVER_PALETTES = [
  { bg: 'from-[#4f342c] to-[#2e1e1a]', accent: '#d8b48a' },
  { bg: 'from-[#2e403d] to-[#1b2725]', accent: '#9ec4bc' },
  { bg: 'from-[#35394b] to-[#212432]', accent: '#b4bedf' },
  { bg: 'from-[#4d3c27] to-[#2e2316]', accent: '#e2c286' },
  { bg: 'from-[#492d38] to-[#2c1a22]', accent: '#dfb2c3' },
  { bg: 'from-[#2f3d2e] to-[#1c261b]', accent: '#adc7aa' },
]

const fallbackPalette = computed(() => {
  let hash = 0
  for (let i = 0; i < props.book.title.length; i += 1) {
    hash = (hash * 31 + props.book.title.charCodeAt(i)) >>> 0
  }
  return COVER_PALETTES[hash % COVER_PALETTES.length]
})
</script>

<template>
  <article
    class="group relative flex flex-col rounded-xl border border-[#473c35] bg-[#342b26] p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#5f5046] hover:bg-[#3d332d] hover:shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
  >
    <!-- Admin actions -->
    <div
      v-if="isAdmin"
      class="absolute right-2 top-2 z-10 flex items-center gap-1 opacity-100 transition-opacity duration-150 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
    >
      <button
        type="button"
        title="Chỉnh sửa sách"
        aria-label="Chỉnh sửa sách"
        class="rounded-md border border-[#5a4c43] bg-[#261f1b]/90 p-1.5 text-[#dfd4c8] backdrop-blur-sm transition hover:border-[#e2b866]/60 hover:text-[#e2b866]"
        @click.stop="emit('edit', book)"
      >
        <Pencil class="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        title="Xóa sách"
        aria-label="Xóa sách"
        class="rounded-md border border-[#5a4c43] bg-[#261f1b]/90 p-1.5 text-[#dfd4c8] backdrop-blur-sm transition hover:border-red-400/60 hover:text-red-300"
        @click.stop="emit('delete', book)"
      >
        <Trash2 class="h-3.5 w-3.5" />
      </button>
    </div>

    <!-- Centered Book Cover -->
    <div class="mb-3 flex justify-center pt-1">
      <div
        class="relative aspect-[2/3] w-24 overflow-hidden rounded-[4px] border border-[#55473e]/70 shadow-[0_6px_14px_rgba(0,0,0,0.45)]"
      >
        <img
          v-if="book.cover_url && !imageError"
          :src="book.cover_url"
          :alt="book.title"
          loading="lazy"
          class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          @error="imageError = true"
        />

        <!-- Vintage hardcover placeholder when no cover image yet -->
        <div
          v-else
          class="relative flex h-full w-full flex-col justify-between bg-gradient-to-br p-2.5 text-left"
          :class="fallbackPalette.bg"
        >
          <!-- Subtle book spine crease -->
          <div
            class="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/40 to-transparent"
          />
          <div
            class="pointer-events-none absolute inset-1.5 rounded-[2px] border border-white/15"
          />
          <span
            class="relative z-10 text-[9px] font-medium uppercase tracking-wider opacity-80"
            :style="{ color: fallbackPalette.accent }"
          >
            {{ book.genres[0] || 'Book' }}
          </span>
          <p
            class="relative z-10 line-clamp-4 font-serif text-[10.5px] font-semibold leading-tight text-[#f3ebe1]"
          >
            {{ book.title }}
          </p>
          <div class="relative z-10 flex items-center gap-0.5 opacity-75">
            <span
              class="h-0.5 w-4 rounded-full"
              :style="{ backgroundColor: fallbackPalette.accent }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Book Info -->
    <div class="flex flex-1 flex-col">
      <h3
        :title="book.title"
        class="mb-2 flex items-start gap-1.5 font-serif text-[13.5px] font-medium leading-snug text-[#efe6dc]"
      >
        <FileText class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9c8c7e]" />
        <span class="line-clamp-3">{{ book.title }}</span>
      </h3>

      <!-- Genre Tags -->
      <div v-if="genreItems.length > 0" class="mb-2.5 flex flex-wrap gap-1">
        <span
          v-for="genre in genreItems"
          :key="genre.name"
          class="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10.5px] font-medium leading-tight"
          :class="genre.badgeClass"
        >
          <component :is="genre.icon" class="h-2.5 w-2.5 shrink-0" :class="genre.iconClass" />
          <span>{{ genre.name }}</span>
        </span>
      </div>

      <!-- Rating & Date pinned to bottom -->
      <div class="mt-auto space-y-1.5 pt-0.5">
        <StarRating :model-value="book.rating" readonly size="sm" />
        <p v-if="formattedDate" class="text-[11px] text-[#9b8c7e]">
          {{ formattedDate }}
        </p>
      </div>
    </div>
  </article>
</template>
