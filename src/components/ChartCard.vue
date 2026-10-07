<script setup>
import { nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  config: { type: Object, required: true },
  height: { type: String, default: '320px' },
})

const canvasRef = ref(null)
let chart = null

async function render() {
  await nextTick()
  if (!canvasRef.value) return
  if (chart) chart.destroy()
  // Chart.js изменяет переданный ему объект конфигурации (дописывает options.scales,
  // нормализует options.plugins), поэтому отдаём ему копию: иначе настройки одного
  // графика попадали бы в общий объект и ломали остальные графики.
  const config = props.config || {}
  chart = new Chart(canvasRef.value.getContext('2d'), {
    ...config,
    options: {
      ...config.options,
      plugins: { ...config.options?.plugins },
    },
  })
}

onMounted(() => {
  render()
})

watch(
  () => props.config,
  () => render(),
  { deep: true }
)

onBeforeUnmount(() => {
  if (chart) chart.destroy()
})
</script>

<template>
  <div class="chart-wrap" :style="{ height }">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<style scoped>
.chart-wrap {
  position: relative;
  width: 100%;
}
</style>
