<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { applicationAssigneeIds, isApplicationAssignedTo, useApplicationsStore } from '../stores/applications'
import { useObjectsStore } from '../stores/objects'
import { useCatalogStore } from '../stores/catalog'
import { useAuthStore } from '../stores/auth'
import ApplicationFormDialog from '../components/ApplicationFormDialog.vue'
import {
  PRIORITIES,
  STATUSES,
  PRIORITY_COLOR,
  PRIORITY_LABEL,
  STATUS_COLOR,
  STATUS_LABEL,
} from '../utils/constants'

const router = useRouter()
const applicationsStore = useApplicationsStore()
const objectsStore = useObjectsStore()
const catalogStore = useCatalogStore()
const authStore = useAuthStore()

const canCreate = computed(() => authStore.role !== 'specialist')

const createDialogVisible = ref(false)
const query = reactive({
  status: '',
  priority: '',
  districtId: '',
})

const visibleApplications = computed(() => {
  let items = applicationsStore.items
  if (authStore.role === 'specialist') {
    items = items.filter((a) => isApplicationAssignedTo(a, authStore.user?.id))
  }
  if (!query.districtId) return items
  return items.filter((a) => {
    const districtId = objectsStore.objectById(a.objectId)?.districtId
    return districtId !== undefined && String(districtId) === String(query.districtId)
  })
})

const districtOf = (app) =>
  catalogStore.districtById(objectsStore.objectById(app.objectId)?.districtId)?.name || ''

const assigneeNames = (app) => catalogStore.userNames(applicationAssigneeIds(app))

function applyFilters() {
  applicationsStore.filters = {
    status: query.status || '',
    priority: query.priority || '',
    districtId: query.districtId || '',
  }
  applicationsStore.fetch()
}

function resetFilters() {
  query.status = ''
  query.priority = ''
  query.districtId = ''
  applyFilters()
}

function openRow(row) {
  router.push(`/applications/${row.id}`)
}

function onSaved() {
  applicationsStore.fetch()
}

onMounted(async () => {
  await Promise.all([catalogStore.load(), objectsStore.fetch(), applicationsStore.fetch()])
})
</script>

<template>
  <div class="page">
    <el-card shadow="never">
      <div class="toolbar">
        <el-select
          v-model="query.status"
          placeholder="Статус"
          clearable
          style="width: 170px"
          @change="applyFilters"
        >
          <el-option v-for="s in STATUSES" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
        <el-select
          v-model="query.priority"
          placeholder="Приоритет"
          clearable
          style="width: 170px"
          @change="applyFilters"
        >
          <el-option v-for="p in PRIORITIES" :key="p.value" :label="p.label" :value="p.value" />
        </el-select>
        <el-select
          v-model="query.districtId"
          placeholder="Район"
          clearable
          style="width: 190px"
          @change="applyFilters"
        >
          <el-option v-for="d in catalogStore.districts" :key="d.id" :label="d.name" :value="d.id" />
        </el-select>
        <el-button @click="resetFilters">Сбросить</el-button>
        <div class="spacer"></div>
        <el-button
          v-if="canCreate"
          type="primary"
          :icon="Plus"
          @click="createDialogVisible = true"
        >Новая заявка</el-button>
      </div>

      <el-table
        :data="visibleApplications"
        v-loading="applicationsStore.loading"
        @row-click="openRow"
      >
        <el-table-column prop="number" label="№" width="130" />
        <el-table-column prop="title" label="Заявка" min-width="220" show-overflow-tooltip />
        <el-table-column label="Объект" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ objectsStore.objectById(row.objectId)?.name || '—' }}</template>
        </el-table-column>
        <el-table-column label="Район" width="150">
          <template #default="{ row }">{{ districtOf(row) }}</template>
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
        <el-table-column label="Ответственные" width="220">
          <template #default="{ row }">{{ assigneeNames(row) }}</template>
        </el-table-column>
        <el-table-column label="Срок" width="130">
          <template #default="{ row }">
            <span v-if="row.deadline">{{ new Date(row.deadline).toLocaleDateString('ru-RU') }}</span>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="Создана" width="150">
          <template #default="{ row }">{{ new Date(row.createdAt).toLocaleDateString('ru-RU') }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <ApplicationFormDialog v-model="createDialogVisible" @saved="onSaved" />
  </div>
</template>

<style scoped>
.el-table :deep(.el-table__row) {
  cursor: pointer;
}
</style>
