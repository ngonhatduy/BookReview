<script setup lang="ts">
import { ArrowUpDown, RotateCcw, Search, Star, X } from 'lucide-vue-next'
import type { SortOption } from '../types/book'

defineProps<{
  search: string
  selectedGenre: string
  selectedRating: number | null
  sortBy: SortOption
  availableGenres: string[]
  hasActiveFilters: boolean
  totalFiltered: number
  totalBooks: number
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:selectedGenre': [value: string]
  'update:selectedRating': [value: number | null]
  'update:sortBy': [value: SortOption]
  reset: []
}>()

const ratingOptions = [5, 4, 3, 2, 1]
</script>

<template>
  <section
    class="mb-5 rounded-xl border border-[#473c35] bg-[#342b26]/75 p-3.5 backdrop-blur-sm"
  >
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <!-- Search + Genre + Sort -->
      <div class="flex flex-1 flex-wrap items-center gap-2.5">
        <!-- Search input -->
        <div class="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search
            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7c6f]"
          />
          <input
            :value="search"
            type="text"
            placeholder="Tìm tên sách..."
            class="w-full rounded-lg border border-[#4b3f37] bg-[#261f1b] py-1.5 pl-9 pr-8 text-sm text-[#efe6dc] placeholder-[#8b7c6f] transition focus:border-[#e2b866]/60 focus:outline-none"
            @input="emit('update:search', ($event.target as HTMLInputElement).value)"
          />
          <button
            v-if="search"
            type="button"
            aria-label="Xóa từ khóa tìm kiếm"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b7c6f] hover:text-[#efe6dc]"
            @click="emit('update:search', '')"
          >
            <X class="h-3.5 w-3.5" />
          </button>
        </div>

        <!-- Genre filter -->
        <select
          :value="selectedGenre"
          aria-label="Lọc theo thể loại"
          class="rounded-lg border border-[#4b3f37] bg-[#261f1b] px-3 py-1.5 text-sm text-[#efe6dc] transition focus:border-[#e2b866]/60 focus:outline-none"
          @change="emit('update:selectedGenre', ($event.target as HTMLSelectElement).value)"
        >
          <option value="all">Tất cả thể loại</option>
          <option v-for="genre in availableGenres" :key="genre" :value="genre">
            {{ genre }}
          </option>
        </select>

        <!-- Sort selector -->
        <div class="relative flex items-center">
          <ArrowUpDown
            class="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#8b7c6f]"
          />
          <select
            :value="sortBy"
            aria-label="Sắp xếp sách"
            class="rounded-lg border border-[#4b3f37] bg-[#261f1b] py-1.5 pl-8 pr-3 text-sm text-[#efe6dc] transition focus:border-[#e2b866]/60 focus:outline-none"
            @change="emit('update:sortBy', ($event.target as HTMLSelectElement).value as SortOption)"
          >
            <option value="newest">Mới đọc nhất</option>
            <option value="rating_desc">Đánh giá cao nhất</option>
            <option value="title_asc">Tên A → Z</option>
          </select>
        </div>
      </div>

      <!-- Star Filter Pills + Reset -->
      <div class="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          class="rounded-lg border px-2.5 py-1 text-xs font-medium transition"
          :class="
            selectedRating === null
              ? 'border-[#e2b866]/60 bg-[#e2b866]/15 text-[#f0cf88]'
              : 'border-[#4b3f37] bg-[#261f1b] text-[#b5a698] hover:border-[#635449] hover:text-[#efe6dc]'
          "
          @click="emit('update:selectedRating', null)"
        >
          Tất cả sao
        </button>

        <button
          v-for="star in ratingOptions"
          :key="star"
          type="button"
          class="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition"
          :class="
            selectedRating === star
              ? 'border-[#e2b866]/60 bg-[#e2b866]/15 text-[#f0cf88]'
              : 'border-[#4b3f37] bg-[#261f1b] text-[#b5a698] hover:border-[#635449] hover:text-[#efe6dc]'
          "
          @click="emit('update:selectedRating', selectedRating === star ? null : star)"
        >
          <span>{{ star }}</span>
          <Star class="h-3 w-3 fill-[#e2b866] text-[#e2b866]" />
        </button>

        <button
          v-if="hasActiveFilters"
          type="button"
          class="ml-1 inline-flex items-center gap-1 rounded-lg border border-[#5a4a3f] bg-[#3d332d] px-2.5 py-1 text-xs font-medium text-[#efe6dc] transition hover:border-[#e2b866]/50"
          @click="emit('reset')"
        >
          <RotateCcw class="h-3 w-3" />
          <span>Xóa lọc ({{ totalFiltered }}/{{ totalBooks }})</span>
        </button>
      </div>
    </div>
  </section>
</template>
