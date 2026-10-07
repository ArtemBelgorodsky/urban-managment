<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useObjectsStore } from '../stores/objects'
import { useCatalogStore } from '../stores/catalog'
import ObjectFormDialog from '../components/ObjectFormDialog.vue'
import {
  OBJECT_TYPES,
  CONDITIONS,
  OBJECT_TYPE_LABEL,
  CONDITION_LABEL,
  CONDITION_COLOR,
} from '../utils/constants'

const route = useRoute()
const router = useRouter()
const objectsStore = useObjectsStore()
const catalogStore = useCatalogStore()

const dialogVisible = ref(false)
const editingRecord = ref(null)
const highlightId = route.query.highlight || null

const rows = computed(() => objectsStore.filtered)

function openCreate() {
  editingRecord.value = null
  dialogVisible.value = true
}

function openEdit(row) {
  editingRecord.value = row
  dialogVisible.value = true
}

async function confirmDelete(row) {
  await ElMessageBox.confirm(
    `Удалить объект «${row.name}»? Данные о заявках сохранятся.`,
    'Удаление объекта',
    { type: 'warning' }
  )
  await objectsStore.remove(row.id)
  ElMessage.success('Объект удалён')
}

watch(
  () => route.query.highlight,
  (val) => {
    if (val) {
      const row = objectsStore.objectById(val)
      if (row) {
        ElMessage.info(`Объект «${row.name}» на карте открыт`)
        router.replace({ query: {} })
      }
    }
  }
)

onMounted(async () => {
  await Promise.all([catalogStore.load(), objectsStore.fetch()])
})
</script>

<template>
  <div class="page">
    <el-card shadow="never">
      <div class="toolbar">
        <el-select
          v-model="objectsStore.filters.type"
          placeholder="Тип объекта"
          clearable
          style="width: 180px"
          @change="objectsStore.setFilters({ type: $event })"
        >
          <el-option v-for="t in OBJECT_TYPES" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
        <el-select
          v-model="objectsStore.filters.districtId"
          placeholder="Район"
          clearable
          style="width: 180px"
          @change="objectsStore.setFilters({ districtId: $event })"
        >
          <el-option v-for="d in catalogStore.districts" :key="d.id" :label="d.name" :value="d.id" />
        </el-select>
        <el-select
          v-model="objectsStore.filters.condition"
          placeholder="Состояние"
          clearable
          style="width: 180px"
          @change="objectsStore.setFilters({ condition: $event })"
        >
          <el-option v-for="c in CONDITIONS" :key="c.value" :label="c.label" :value="c.value" />
        </el-select>
        <el-button @click="objectsStore.setFilters({ type: '', districtId: '', condition: '' })">
          Сбросить
        </el-button>
        <div class="spacer"></div>
        <el-button type="primary" :icon="Plus" @click="openCreate">Добавить объект</el-button>
      </div>

      <el-table :data="rows" v-loading="objectsStore.loading">
        <el-table-column prop="name" label="Название" min-width="240" show-overflow-tooltip />
        <el-table-column label="Тип" width="170">
          <template #default="{ row }">{{ OBJECT_TYPE_LABEL(row.type) }}</template>
        </el-table-column>
        <el-table-column label="Район" width="170">
          <template #default="{ row }">{{ catalogStore.districtById(row.districtId)?.name || '—' }}</template>
        </el-table-column>
        <el-table-column prop="address" label="Адрес" min-width="220" show-overflow-tooltip />
        <el-table-column label="Состояние" width="180">
          <template #default="{ row }">
            <el-tag :color="CONDITION_COLOR(row.condition)" style="color:#fff; border:none">
              {{ CONDITION_LABEL(row.condition) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Ввод в эксплуатацию" width="140">
          <template #default="{ row }">
            {{ row.commissioningDate || '—' }}
          </template>
        </el-table-column>
        <el-table-column label="Координаты" width="170">
          <template #default="{ row }">{{ row.latitude }}, {{ row.longitude }}</template>
        </el-table-column>
        <el-table-column label="Действия" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" :icon="Edit" @click="openEdit(row)">Изменить</el-button>
            <el-button link type="danger" size="small" :icon="Delete" @click="confirmDelete(row)">Удалить</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <ObjectFormDialog v-model="dialogVisible" :record="editingRecord" @saved="() => objectsStore.fetch()" />
  </div>
</template>