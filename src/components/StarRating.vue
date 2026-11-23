<script setup lang="ts">
import { computed, ref } from 'vue'
import { Star } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: number
    readonly?: boolean
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    readonly: true,
    size: 'sm',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const hoverValue = ref<number | null>(null)

const displayValue = computed(() => {
  if (!props.readonly && hoverValue.value !== null) {
    return hoverValue.value
  }
  return props.modelValue
})

const iconSizeClass = computed(() => {
  switch (props.size) {
    case 'lg':
      return 'h-6 w-6'
    case 'md':
      return 'h-4 w-4'
    default:
      return 'h-3.5 w-3.5'
  }
})

const gapClass = computed(() => {
  return props.size === 'lg' ? 'gap-1.5' : 'gap-0.5'
})

function selectRating(star: number) {
  if (props.readonly) return
  emit('update:modelValue', star)
}
</script>

<template>
  <div
    class="inline-flex items-center"
    :class="gapClass"
    :role="readonly ? 'img' : 'radiogroup'"
    :aria-label="`Đánh giá ${modelValue} trên 5 sao`"
  >
    <template v-if="readonly">
      <Star
        v-for="star in 5"
        :key="star"
        :class="[
          iconSizeClass,
          star <= displayValue
            ? 'fill-[#e2b866] text-[#e2b866]'
            : 'fill-transparent text-[#66584e]',
        ]"
        :stroke-width="1.8"
      />
    </template>

    <template v-else>
      <button
        v-for="star in 5"
        :key="star"
        type="button"
        role="radio"
        :aria-checked="star === modelValue"
        :aria-label="`${star} sao`"
        class="rounded p-0.5 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#e2b866]/50"
        @mouseenter="hoverValue = star"
        @mouseleave="hoverValue = null"
        @click="selectRating(star)"
      >
        <Star
          :class="[
            iconSizeClass,
            'transition-colors',
            star <= displayValue
              ? 'fill-[#e2b866] text-[#e2b866]'
              : 'fill-transparent text-[#66584e] hover:text-[#a89585]',
          ]"
          :stroke-width="1.8"
        />
      </button>
    </template>
  </div>
</template>
