<script setup>
import { computed, onMounted } from 'vue'
import { useObjectsStore } from '../stores/objects'
import { applicationAssigneeIds, useApplicationsStore } from '../stores/applications'
import { useCatalogStore } from '../stores/catalog'
import ChartCard from '../components/ChartCard.vue'
import {
  OBJECT_TYPES,
  CONDITIONS,
  PRIORITIES,
  STATUSES,
  OBJECT_TYPE_LABEL,
  CONDITION_LABEL,
  PRIORITY_LABEL,
} from '../utils/constants'

const objectsStore = useObjectsStore()
const applicationsStore = useApplicationsStore()
const catalogStore = useCatalogStore()

function hexToRgba(hex, alpha) {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Chart.js дописывает в переданный ему объект options собственные настройки
// (в первую очередь options.scales). Общий объект на все графики приводил к тому,
// что конфигурация осей одного графика «протекала» в остальные и ломала
// горизонтальные диаграммы (indexAxis: 'y'), поэтому настройки создаются заново для каждого графика.
function chartOptions({ legend = { position: 'bottom' }, ...rest } = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend },
    ...rest,
  }
}

const objectTypesChart = computed(() => {
  const labels = OBJECT_TYPES.map((t) => t.label)
  const data = OBJECT_TYPES.map((t) => objectsStore.typesStats[t.value] || 0)
  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Объектов',
          data,
          backgroundColor: '#409eff',
          borderRadius: 4,
        },
      ],
    },
    options: chartOptions({ legend: { display: false } }),
  }
})

const objectConditionsChart = computed(() => {
  const rows = CONDITIONS.map((c) => ({ label: c.label, value: objectsStore.conditionsStats[c.value] || 0, color: c.color }))
  return {
    type: 'doughnut',
    data: {
      labels: rows.map((r) => r.label),
      datasets: [
        {
          data: rows.map((r) => r.value),
          backgroundColor: rows.map((r) => r.color),
          borderWidth: 2,
        },
      ],
    },
    options: chartOptions(),
  }
})

function districtOfApp(app) {
  return catalogStore.districtById(objectsStore.objectById(app.objectId)?.districtId)?.name || 'Без района'
}

const applicationsByDistrictChart = computed(() => {
  const counts = {}
  applicationsStore.items.forEach((a) => {
    const d = districtOfApp(a)
    counts[d] = (counts[d] || 0) + 1
  })
  return {
    type: 'bar',
    data: {
      labels: Object.keys(counts),
      datasets: [
        {
          label: 'Заявок',
          data: Object.values(counts),
          backgroundColor: '#9254de',
          borderRadius: 4,
        },
      ],
    },
    options: chartOptions({ legend: { display: false }, indexAxis: 'y' }),
  }
})

const applicationsByPriorityChart = computed(() => {
  const rows = PRIORITIES.map((p) => ({ label: p.label, value: applicationsStore.priorityStats[p.value] || 0, color: p.color }))
  return {
    type: 'pie',
    data: {
      labels: rows.map((r) => r.label),
      datasets: [{ data: rows.map((r) => r.value), backgroundColor: rows.map((r) => r.color), borderWidth: 2 }],
    },
    options: chartOptions(),
  }
})

const applicationsStatusChart = computed(() => {
  const rows = STATUSES.map((s) => ({ label: s.label, value: applicationsStore.statusStats[s.value] || 0, color: s.color }))
  return {
    type: 'bar',
    data: {
      labels: rows.map((r) => r.label),
      datasets: [{ label: 'Заявок', data: rows.map((r) => r.value), backgroundColor: rows.map((r) => r.color), borderRadius: 4 }],
    },
    options: chartOptions({ legend: { display: false } }),
  }
})

const monthlyDynamicsChart = computed(() => {
  const months = {}
  applicationsStore.items.forEach((a) => {
    if (!a.createdAt) return
    const d = new Date(a.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months[key] = (months[key] || 0) + 1
  })
  const keys = Object.keys(months).sort()
  const labels = keys.map((k) => {
    const [y, m] = k.split('-')
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
    return `${monthNames[Number(m) - 1]} ${y}`
  })
  return {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Новых заявок',
          data: keys.map((k) => months[k]),
          borderColor: '#409eff',
          backgroundColor: hexToRgba('#409eff', 0.15),
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: chartOptions(),
  }
})

const resolutionTimeByDivisionChart = computed(() => {
  const items = applicationsStore.items.filter((a) => a.resolvedAt && a.createdAt)
  const groups = {}
  items.forEach((a) => {
    const divId = a.divisionId
    if (divId === undefined || divId === null) return
    const key = String(divId)
    const minutes = (new Date(a.resolvedAt) - new Date(a.createdAt)) / 60000
    if (!groups[key]) groups[key] = { total: 0, count: 0 }
    groups[key].total += Math.max(0, minutes)
    groups[key].count += 1
  })
  const labels = Object.keys(groups).map((k) => catalogStore.divisionById(k)?.name || 'Без подразделения')
  const data = Object.values(groups).map((g) => (g.total / g.count / 1440).toFixed(1))
  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Ср. время устранения, дней',
          data,
          backgroundColor: '#67c23a',
          borderRadius: 4,
        },
      ],
    },
    options: chartOptions({ legend: { display: false } }),
  }
})

const workloadChart = computed(() => {
  const counts = {}
  const active = applicationsStore.items.filter((a) => ['new', 'assigned', 'in_progress'].includes(a.status))
  active.forEach((a) => {
    applicationAssigneeIds(a).forEach((key) => {
      counts[key] = (counts[key] || 0) + 1
    })
  })
  const entries = Object.keys(counts)
    .map((k) => ({ name: catalogStore.userName(k), count: counts[k] }))
    .sort((a, b) => b.count - a.count)
  return {
    type: 'bar',
    data: {
      labels: entries.map((e) => e.name),
      datasets: [
        {
          label: 'Активных заявок',
          data: entries.map((e) => e.count),
          backgroundColor: '#f56c6c',
          borderRadius: 4,
        },
      ],
    },
    options: chartOptions({ legend: { display: false }, indexAxis: 'y' }),
  }
})

const summary = computed(() => {
  const withDeadline = applicationsStore.items.filter((a) => a.deadline)
  const overdue = withDeadline.filter((a) => new Date(a.deadline) < new Date() && !['done', 'closed'].includes(a.status))
  const done = applicationsStore.items.filter((a) => ['done', 'closed'].includes(a.status))
  return {
    total: applicationsStore.items.length,
    done: done.length,
    overdue,
  }
})

onMounted(async () => {
  await Promise.all([catalogStore.load(), applicationsStore.fetchAll(), objectsStore.fetch()])
})
</script>

<template>
  <div class="page">
    <el-row :gutter="16" class="mb-16">
      <el-col :span="8">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-value">{{ summary.total }}</div>
          <div class="text-muted">Всего заявок</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-value">{{ summary.done }}</div>
          <div class="text-muted">Выполнено</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-value" style="color: #f56c6c">{{ summary.overdue.length }}</div>
          <div class="text-muted">Просроченных (срок не выдержан)</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card shadow="never" class="mb-16" header="Техническое состояние объектов">
          <ChartCard :config="objectConditionsChart" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" class="mb-16" header="Объекты по типам">
          <ChartCard :config="objectTypesChart" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" class="mb-16" header="Заявки по районам">
          <ChartCard :config="applicationsByDistrictChart" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" class="mb-16" header="Распределение по приоритетам">
          <ChartCard :config="applicationsByPriorityChart" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" class="mb-16" header="Динамика поступления заявок">
          <ChartCard :config="monthlyDynamicsChart" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" class="mb-16" header="Статусы заявок">
          <ChartCard :config="applicationsStatusChart" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" class="mb-16" header="Среднее время устранения по подразделениям (дни)">
          <ChartCard :config="resolutionTimeByDivisionChart" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" class="mb-16" header="Загруженность специалистов (активные заявки)">
          <ChartCard :config="workloadChart" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.stat-value {
  font-size: 26px;
  font-weight: 700;
}
</style>
