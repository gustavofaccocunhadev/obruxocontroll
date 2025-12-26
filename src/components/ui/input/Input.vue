<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { useAttrs } from "vue"
import { cn } from "@/lib/utils"

interface Props {
  class?: HTMLAttributes["class"]
  modelValue?: string
  type?: string
}

defineOptions({ inheritAttrs: false })

const props = defineProps<Props>()
const emit = defineEmits<{
  "update:modelValue": [value: string]
}>()
const attrs = useAttrs()
</script>

<template>
  <input
    v-bind="attrs"
    :type="props.type ?? 'text'"
    :class="cn(
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      props.class,
    )"
    :value="props.modelValue"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
