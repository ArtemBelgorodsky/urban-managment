<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useObjectsStore } from '../stores/objects'
import { isApplicationAssignedTo, useApplicationsStore } from '../stores/applications'
import { useCatalogStore } from '../stores/catalog'
import { useAuthStore } from '../stores/auth'
import LeafletMap from '../components/LeafletMap.vue'
import ApplicationFormDialog from '../components/ApplicationFormDialog.vue'
import {
  OBJECT_TYPES,
  CONDITIONS,
  OBJECT_TYPE_LABEL,
  CONDITION_COLOR,
  CONDITION_LABEL,
  PRIORITY_COLOR,
  PRIORITY_LABEL,
  STATUS_LABEL,
  STATUS_COLOR,
} from '../utils/constants'

const router = useRouter()
const objectsStore = useObjectsStore()
const applicationsStore = useApplicationsStore()
const catalogStore = useCatalogStore()
const authStore = useAuthStore()

const canCreate = computed(() => authStore.role !== 'specialist')

const showApplications = ref(true)
const createDialogVisible = ref(false)
const presetObjectId = ref(null)

const specialistObjects = computed(() => {
  if (authStore.role !== 'specialist') return objectsStore.filtered
  const specialistObjectIds = new Set(
    applicationsStore.activeApplications
      .filter((a) => isApplicationAssignedTo(a, authStore.user?.id))
      .map((a) => String(a.objectId))
  )
  return objectsStore.filtered.filter((o) => specialistObjectIds.has(String(o.id)))
})

const visibleApplications = computed(() => {
  if (authStore.role !== 'specialist') return applicationsStore.items
  return applicationsStore.items.filter((a) => isApplicationAssignedTo(a, authStore.user?.id))
})

const stats = computed(() => {
  const objects = specialistObjects.value
  const applications = visibleApplications.value

  return {
    objects: objects.length,
    needsAttention: objects.filter((o) => ['repair', 'emergency'].includes(o.condition)).length,
    openApps: applications.filter((a) => ['new', 'assigned', 'in_progress'].includes(a.status)).length,
    inProgress: applications.filter((a) => a.status === 'in_progress').length,
  }
})

const recentApplications = computed(() =>
  [...visibleApplications.value]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 6)
)

const mapApplications = computed(() => {
  let apps = applicationsStore.activeApplications
  if (authStore.role === 'specialist') {
    apps = apps.filter((a) => isApplicationAssignedTo(a, authStore.user?.id))
  }
  return apps
    .map((a) => {
      const obj = objectsStore.objectById(a.objectId)
      return obj ? { ...a, name: obj.name, latitude: obj.latitude, longitude: obj.longitude } : null
    })
    .filter(Boolean)
})

function openApplication(app) {
  router.push(`/applications/${app.id}`)
}

function openObject(obj) {
  router.push(`/objects?highlight=${obj.id}`)
}

function createApplicationForObject(obj) {
  presetObjectId.value = obj.id
  createDialogVisible.value = true
}

function openCreateDialog() {
  presetObjectId.value = null
  createDialogVisible.value = true
}

function onSaved(saved) {
  ElMessage.success(saved ? `Заявка «${saved.number || ''}» сохранена` : 'сохранено')
  catalogStore.load()
  applicationsStore.fetch()
  objectsStore.fetch()
}

async function refreshAll() {
  await Promise.all([objectsStore.fetch(), applicationsStore.fetch()])
}

onMounted(async () => {
  await Promise.all([catalogStore.load(), refreshAll()])
})
</script>

<template>
  <div class="page">
    <el-row :gutter="16" class="mb-16">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-inner">
            <el-icon :size="28" color="#409eff"><OfficeBuilding /></el-icon>
            <div>
              <div class="stat-value">{{ stats.objects }}</div>
              <div class="text-muted">Всего объектов</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-inner">
            <el-icon :size="28" color="#f56c6c"><Warning /></el-icon>
            <div>
              <div class="stat-value">{{ stats.needsAttention }}</div>
              <div class="text-muted">Требуют внимания</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-inner">
            <el-icon :size="28" color="#e6a23c"><Tickets /></el-icon>
            <div>
              <div class="stat-value">{{ stats.openApps }}</div>
              <div class="text-muted">Открытые заявки</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-inner">
            <el-icon :size="28" color="#9254de"><Loading /></el-icon>
            <div>
              <div class="stat-value">{{ stats.inProgress }}</div>
              <div class="text-muted">В работе</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="mb-16">
      <div class="toolbar">
        <el-select
          v-model="objectsStore.filters.type"
          placeholder="Тип объекта"
          clearable
          style="width: 190px"
          @change="objectsStore.setFilters({ type: $event })"
        >
          <el-option v-for="t in OBJECT_TYPES" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
        <el-select
          v-model="objectsStore.filters.districtId"
          placeholder="Район"
          clearable
          style="width: 190px"
          @change="objectsStore.setFilters({ districtId: $event })"
        >
          <el-option v-for="d in catalogStore.districts" :key="d.id" :label="d.name" :value="d.id" />
        </el-select>
        <el-select
          v-model="objectsStore.filters.condition"
          placeholder="Состояние"
          clearable
          style="width: 190px"
          @change="objectsStore.setFilters({ condition: $event })"
        >
          <el-option v-for="c in CONDITIONS" :key="c.value" :label="c.label" :value="c.value" />
        </el-select>
        <el-checkbox v-model="showApplications" class="ml-8">Показывать активные заявки</el-checkbox>
        <div class="spacer"></div>
        <el-button v-if="canCreate" type="primary" :icon="Plus" @click="openCreateDialog">Новая заявка</el-button>
      </div>

      <div class="legend">
        <span>Состояние объекта:</span>
        <span v-for="c in CONDITIONS" :key="c.value" class="legend-item">
          <span class="legend-dot" :style="{ background: c.color }"></span>{{ c.label }}
        </span>
        <span class="legend-item">
          <span class="legend-dot dash"></span>Активная заявка (пунктир)
        </span>
      </div>

      <LeafletMap
        :objects="specialistObjects"
        :applications="mapApplications"
        :show-applications="showApplications"
        :can-create-application="canCreate"
        height="600px"
        @create-application="createApplicationForObject"
        @open-application="openApplication"
        @open-object="openObject"
      />
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>Последние заявки</span>
          <el-button link type="primary" @click="router.push('/applications')">Все заявки</el-button>
        </div>
      </template>
      <el-table :data="recentApplications" v-loading="applicationsStore.loading" @row-click="(row) => openApplication(row)">
        <el-table-column prop="number" label="№" width="130" />
        <el-table-column prop="title" label="Заявка" min-width="220" show-overflow-tooltip />
        <el-table-column label="Район" width="150">
          <template #default="{ row }">
            {{ catalogStore.districtById(objectsStore.objectById(row.objectId)?.districtId)?.name || '—' }}
          </template>
        </el-table-column>
        <el-table-column label="Приоритет" width="120">
          <template #default="{ row }">
            <el-tag :color="PRIORITY_COLOR(row.priority)" style="color:#fff; border:none" size="small">
              {{ PRIORITY_LABEL(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Статус" width="130">
          <template #default="{ row }">
            <el-tag :color="STATUS_COLOR(row.status)" style="color:#fff; border:none" size="small">
              {{ STATUS_LABEL(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Создана" width="160">
          <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString('ru-RU') }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <ApplicationFormDialog
      v-model="createDialogVisible"
      :preset-object-id="presetObjectId"
      @saved="onSaved"
    />
  </div>
</template>

<style scoped>
.stat-inner {
  display: flex;
  align-items: center;
  gap: 14px;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
}

.ml-8 {
  margin-left: 8px;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #606266;
  margin-bottom: 10px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.legend-dot.dash {
  border: 2px dashed #d03050;
  background: #fff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.el-table :deep(.el-table__row) {
  cursor: pointer;
}
</style>
