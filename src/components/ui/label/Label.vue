<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { useAttrs } from "vue"
import { cn } from "@/lib/utils"

interface Props {
  class?: HTMLAttributes["class"]
}

defineOptions({ inheritAttrs: false })

const props = defineProps<Props>()
const attrs = useAttrs()
</script>

<template>
  <label
    v-bind="attrs"
    data-slot="label"
    :class="cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      props.class,
    )"
  >
    <slot />
  </label>
</template>
