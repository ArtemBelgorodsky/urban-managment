<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { applicationAssigneeIds, isApplicationAssignedTo, useApplicationsStore } from '../stores/applications'
import { useObjectsStore } from '../stores/objects'
import { useCatalogStore } from '../stores/catalog'
import { useAuthStore } from '../stores/auth'
import {
  PRIORITY_COLOR,
  PRIORITY_LABEL,
  STATUS_COLOR,
  STATUS_LABEL,
  OBJECT_TYPE_LABEL,
  CONDITION_LABEL,
  CONDITION_COLOR,
} from '../utils/constants'

const route = useRoute()
const router = useRouter()
const applicationsStore = useApplicationsStore()
const objectsStore = useObjectsStore()
const catalogStore = useCatalogStore()
const authStore = useAuthStore()

const assignDialogVisible = ref(false)
const assignForm = ref({ assigneeIds: [], divisionId: null, comment: '' })

const completeDialogVisible = ref(false)
const completeForm = ref({ title: '', description: '', materials: '', result: '' })

const commentText = ref('')
const closeComment = ref('')

const app = computed(() => applicationsStore.current || {})
const object = computed(() => objectsStore.objectById(app.value.objectId))
const district = computed(() => catalogStore.districtById(object.value?.districtId))
const division = computed(() => catalogStore.divisionById(app.value.divisionId))

const isMyApplication = computed(() => {
  return isApplicationAssignedTo(app.value, authStore.user?.id)
})

const canManage = computed(() => {
  const activeStatuses = ['new', 'assigned', 'in_progress']
  if (!activeStatuses.includes(app.value.status)) return false
  if (authStore.isAdmin || authStore.role === 'head') return true
  if (authStore.role === 'specialist') return isMyApplication.value
  return false
})

const canInteract = computed(() => authStore.role !== 'specialist' || isMyApplication.value)

function canAssign() {
  return (authStore.isAdmin || authStore.role === 'head') && app.value.status === 'new'
}

function canStart() {
  return canManage.value && app.value.status === 'assigned'
}

function canComplete() {
  return canManage.value && app.value.status === 'in_progress'
}

function canClose() {
  return canManage.value && ['done'].includes(app.value.status)
}

function actionLabel(action) {
  return {
    created: 'Заявка создана',
    assigned: 'Назначены исполнители',
    started: 'Работы начаты',
    completed: 'Заявка выполнена',
    closed: 'Заявка закрыта',
    commented: 'Комментарий',
  }[action] || action
}

function openAssignDialog() {
  assignForm.value = {
    assigneeIds: applicationAssigneeIds(app.value),
    divisionId: app.value.divisionId ?? object.value?.divisionId ?? null,
    comment: '',
  }
  assignDialogVisible.value = true
}

async function submitAssign() {
  if (!assignForm.value.assigneeIds.length) {
    ElMessage.warning('Выберите ответственных специалистов')
    return
  }
  await applicationsStore.assign(app.value.id, assignForm.value)
  ElMessage.success('Исполнители назначены')
  assignDialogVisible.value = false
}

function openCompleteDialog() {
  completeForm.value = {
    title: `Выполнение работ по заявке ${app.value.number || ''}`.trim(),
    description: '',
    materials: '',
    result: '',
  }
  completeDialogVisible.value = true
}

async function submitComplete() {
  await applicationsStore.complete(app.value.id, {
    ...completeForm.value,
    objectId: app.value.objectId,
  })
  ElMessage.success('Заявка выполнена, акт работ сохранён')
  completeDialogVisible.value = false
}

async function confirmStart() {
  await applicationsStore.start(app.value.id, 'Приступили к выполнению')
  ElMessage.success('Статус изменён: в работе')
}

async function confirmClose() {
  await ElMessageBox.confirm('Закрыть заявку?', 'Подтверждение', { type: 'warning' })
  await applicationsStore.close(app.value.id, closeComment.value || 'Заявка закрыта')
  ElMessage.success('Заявка закрыта')
}

async function submitComment() {
  if (!commentText.value.trim()) return
  await applicationsStore.addComment(app.value.id, commentText.value)
  commentText.value = ''
  ElMessage.success('Комментарий добавлен')
}

const photoUrl = ref('')

const assigneeNames = computed(() => catalogStore.userNames(applicationAssigneeIds(app.value)))

function normalizePhotoUrl(value) {
  const url = (value || '').trim()
  if (!url) return ''
  if (!/^https?:\/\//i.test(url)) return ''
  return url
}

async function addPhotoByUrl() {
  const url = normalizePhotoUrl(photoUrl.value)
  if (!url) {
    ElMessage.warning('Вставьте корректную ссылку на фото (http:// или https://)')
    return
  }
  const photos = [...(app.value.photos || []), url]
  await applicationsStore.update(app.value.id, { photos })
  applicationsStore.current.photos = photos
  photoUrl.value = ''
  ElMessage.success('Фото прикреплено')
}

async function removePhoto(index) {
  const photos = [...(app.value.photos || [])]
  photos.splice(index, 1)
  await applicationsStore.update(app.value.id, { photos })
  applicationsStore.current.photos = photos
  ElMessage.success('Фото удалено')
}

function openMap() {
  if (object.value) router.push('/')
}

function objectConditionColor() {
  return CONDITION_COLOR(object.value?.condition)
}

async function load() {
  await Promise.all([catalogStore.load(), objectsStore.fetch()])
  await applicationsStore.fetchOne(route.params.id)
}

onMounted(load)

watch(
  () => route.params.id,
  () => applicationsStore.fetchOne(route.params.id)
)
</script>

<template>
  <div class="page">
    <div class="toolbar">
      <el-button :icon="ArrowLeft" @click="router.back()">Назад</el-button>
      <div class="spacer"></div>
      <el-button v-if="canAssign()" type="primary" :icon="User" @click="openAssignDialog">
        Назначить исполнителя
      </el-button>
      <el-button v-if="canStart()" type="warning" @click="confirmStart">Начать работу</el-button>
      <el-button v-if="canComplete()" type="success" @click="openCompleteDialog">Завершить работу</el-button>
      <el-button v-if="canClose()" type="info" @click="confirmClose">Закрыть заявку</el-button>
    </div>

    <el-card shadow="never" v-loading="applicationsStore.detailLoading">
      <template #header>
        <div class="card-header">
          <div>
            <h2 class="app-title">{{ app.title }}</h2>
            <span class="app-number">{{ app.number }}</span>
          </div>
          <div class="header-tags">
            <el-tag :color="PRIORITY_COLOR(app.priority)" style="color:#fff; border:none">
              {{ PRIORITY_LABEL(app.priority) }}
            </el-tag>
            <el-tag :color="STATUS_COLOR(app.status)" style="color:#fff; border:none">
              {{ STATUS_LABEL(app.status) }}
            </el-tag>
          </div>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="Объект">
          {{ object?.name || '—' }}
        </el-descriptions-item>
        <el-descriptions-item label="Тип объекта">
          {{ OBJECT_TYPE_LABEL(object?.type) }}
        </el-descriptions-item>
        <el-descriptions-item label="Район">
          {{ district?.name || '—' }}
        </el-descriptions-item>
        <el-descriptions-item label="Адрес">
          {{ object?.address || '—' }}
        </el-descriptions-item>
        <el-descriptions-item label="Состояние объекта">
          <span :style="{ color: objectConditionColor(), fontWeight: 600 }">
            {{ CONDITION_LABEL(object?.condition) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="Срок устранения">
          <span v-if="app.deadline">{{ new Date(app.deadline).toLocaleString('ru-RU') }}</span>
          <span v-else class="text-muted">не установлен</span>
        </el-descriptions-item>
        <el-descriptions-item label="Заявитель">
          {{ catalogStore.userName(app.reporterId) }}
        </el-descriptions-item>
        <el-descriptions-item label="Ответственные">
          {{ assigneeNames }}
        </el-descriptions-item>
        <el-descriptions-item label="Подразделение">
          {{ division?.name || '—' }}
        </el-descriptions-item>
        <el-descriptions-item label="Создана">
          {{ app.createdAt ? new Date(app.createdAt).toLocaleString('ru-RU') : '—' }}
        </el-descriptions-item>
      </el-descriptions>

      <h3 class="section-title">Описание проблемы</h3>
      <p class="desc-text">{{ app.description || '—' }}</p>

      <h3 v-if="app.photos?.length" class="section-title">Фотографии</h3>
      <div v-if="app.photos?.length" class="photo-row">
        <div v-for="(photo, i) in app.photos" :key="i" class="photo-item">
          <el-image
            :src="photo"
            :preview-src-list="app.photos"
            :initial-index="i"
            fit="cover"
            class="photo"
          />
          <el-button
            v-if="canInteract"
            class="photo-remove"
            :icon="Delete"
            size="small"
            circle
            @click="removePhoto(i)"
          />
        </div>
      </div>

      <h3 v-if="canInteract" class="section-title">Прикрепить фото</h3>
      <div v-if="canInteract" class="photo-add">
        <el-input
          v-model="photoUrl"
          placeholder="Вставьте ссылку на фото в интернете (http/https)"
          clearable
          @keyup.enter="addPhotoByUrl"
        />
        <el-button type="primary" :icon="Plus" @click="addPhotoByUrl">Прикрепить</el-button>
      </div>
    </el-card>

    <el-row :gutter="16" class="mt-16">
      <el-col :span="14">
        <el-card shadow="never" class="mb-16">
          <template #header><span>История изменений</span></template>
          <el-timeline v-if="applicationsStore.history.length">
            <el-timeline-item
              v-for="item in applicationsStore.history"
              :key="item.id"
              :timestamp="new Date(item.createdAt).toLocaleString('ru-RU')"
              placement="top"
            >
              <div class="history-item">
                <div class="history-action">{{ actionLabel(item.action) }}</div>
                <div class="text-muted">
                  {{ catalogStore.userName(item.userId) }}
                  <span v-if="item.statusFrom">: {{ STATUS_LABEL(item.statusFrom) }}</span>
                  <span v-if="item.statusFrom && item.statusTo"> → </span>
                  <span v-if="item.statusTo">{{ STATUS_LABEL(item.statusTo) }}</span>
                </div>
                <div v-if="item.description" class="history-desc">{{ item.description }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="История изменений пуста" />
        </el-card>

        <el-card shadow="never" class="mb-16">
          <template #header><span>Выполненные работы</span></template>
          <el-table v-if="applicationsStore.works.length" :data="applicationsStore.works" size="small">
            <el-table-column prop="title" label="Работа" min-width="180" />
            <el-table-column prop="description" label="Описание" min-width="200" show-overflow-tooltip />
            <el-table-column prop="materials" label="Материалы" width="160" show-overflow-tooltip />
            <el-table-column label="Исполнитель" width="160">
              <template #default="{ row }">{{ catalogStore.userName(row.executorId) }}</template>
            </el-table-column>
            <el-table-column label="Завершено" width="140">
              <template #default="{ row }">
                {{ row.finishedAt ? new Date(row.finishedAt).toLocaleDateString('ru-RU') : '—' }}
              </template>
            </el-table-column>
            <el-table-column prop="result" label="Результат" min-width="180" show-overflow-tooltip />
          </el-table>
          <el-empty v-else description="Работы не зафиксированы" />
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card shadow="never" class="mb-16" v-if="canInteract">
          <template #header><span>Комментарии</span></template>
          <div class="comment-box">
            <el-input
              v-model="commentText"
              type="textarea"
              :rows="3"
              placeholder="Добавить комментарий к заявке"
            />
            <el-button type="primary" size="small" class="mt-8" :icon="ChatDotRound" @click="submitComment">
              Добавить
            </el-button>
          </div>
        </el-card>

        <el-card shadow="never" v-if="object">
          <template #header>
            <div class="card-header">
              <span>Объект на карте</span>
              <el-button link type="primary" @click="openMap">Открыть карту</el-button>
            </div>
          </template>
          <div class="text-muted mb-16">
            {{ object.address }} — {{ district?.name }}
          </div>
          <LeafletMap
            :objects="[object]"
            :applications="[]"
            :show-applications="false"
            :can-create-application="authStore.role !== 'specialist'"
            height="260px"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="assignDialogVisible" title="Назначение исполнителя" width="480px">
      <el-form label-width="150px">
        <el-form-item label="Специалисты">
          <el-select v-model="assignForm.assigneeIds" multiple filterable style="width: 100%">
            <el-option
              v-for="u in catalogStore.specialists"
              :key="u.id"
              :label="u.fullName"
              :value="u.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Подразделение">
          <el-select v-model="assignForm.divisionId" clearable style="width: 100%">
            <el-option v-for="d in catalogStore.divisions" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Комментарий">
          <el-input v-model="assignForm.comment" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">Отмена</el-button>
        <el-button type="primary" @click="submitAssign">Назначить</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="completeDialogVisible" title="Завершение работ" width="520px">
      <el-form label-width="120px">
        <el-form-item label="Наименование">
          <el-input v-model="completeForm.title" />
        </el-form-item>
        <el-form-item label="Описание работ">
          <el-input v-model="completeForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="Материалы">
          <el-input v-model="completeForm.materials" placeholder="Например: асфальт 3 т, люк 1 шт" />
        </el-form-item>
        <el-form-item label="Результат">
          <el-input v-model="completeForm.result" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible = false">Отмена</el-button>
        <el-button type="success" @click="submitComplete">Зафиксировать</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.header-tags {
  display: flex;
  gap: 8px;
}

.app-title {
  font-size: 18px;
  color: #1f2d3d;
}

.app-number {
  font-size: 13px;
  color: #909399;
}

.section-title {
  margin: 18px 0 8px;
  font-size: 15px;
  color: #1f2d3d;
}

.desc-text {
  color: #303133;
  line-height: 1.6;
  white-space: pre-wrap;
}

.photo-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.photo-item {
  position: relative;
}

.photo-remove {
  position: absolute;
  top: -10px;
  right: -10px;
}

.photo-add {
  display: flex;
  gap: 8px;
  max-width: 520px;
}

.photo {
  width: 140px;
  height: 100px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  display: block;
}

.history-item {
  line-height: 1.5;
}

.history-action {
  font-weight: 600;
  color: #303133;
}

.history-desc {
  margin-top: 2px;
  color: #606266;
  white-space: pre-wrap;
}

.comment-box {
  display: flex;
  flex-direction: column;
}
</style>
