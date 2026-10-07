<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { useApplicationsStore } from '../stores/applications'
import { useObjectsStore } from '../stores/objects'
import { PRIORITIES } from '../utils/constants'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  record: { type: Object, default: null },
  presetObjectId: { type: [Number, String], default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const applicationsStore = useApplicationsStore()
const objectsStore = useObjectsStore()

const formRef = ref(null)
const saving = ref(false)

const form = ref({
  objectId: null,
  title: '',
  description: '',
  priority: 'medium',
  deadline: '',
  photos: [],
})

const rules = {
  objectId: [{ required: true, message: 'Выберите объект инфраструктуры', trigger: 'change' }],
  title: [{ required: true, message: 'Укажите краткое описание проблемы', trigger: 'blur' }],
  description: [{ required: true, message: 'Опишите проблему подробнее', trigger: 'blur' }],
}

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return
    if (props.record) {
      form.value = {
        objectId: props.record.objectId,
        title: props.record.title || '',
        description: props.record.description || '',
        priority: props.record.priority || 'medium',
        deadline: props.record.deadline || '',
        photos: [...(props.record.photos || [])],
      }
    } else {
      form.value = {
        objectId: props.presetObjectId,
        title: '',
        description: '',
        priority: 'medium',
        deadline: '',
        photos: [],
      }
    }
  }
)

function addPhotoUrl() {
  const url = photoUrl.value.trim()
  if (!url) {
    ElMessage.warning('Вставьте ссылку на фото в интернете')
    return
  }
  if (!/^https?:\/\//i.test(url)) {
    ElMessage.warning('Ссылка должна начинаться с http:// или https://')
    return
  }
  if (form.value.photos.length >= 6) {
    ElMessage.warning('Максимум 6 фотографий')
    return
  }
  form.value.photos.push(url)
  photoUrl.value = ''
}

const photoUrl = ref('')

async function submit() {
  await formRef.value.validate()
  saving.value = true
  try {
    let payload = {
      objectId: form.value.objectId,
      title: form.value.title,
      description: form.value.description,
      priority: form.value.priority,
      deadline: form.value.deadline ? new Date(form.value.deadline).toISOString() : null,
      photos: form.value.photos,
    }
    if (props.record) {
      await applicationsStore.update(props.record.id, payload)
      payload = { ...payload, id: props.record.id }
      ElMessage.success('Заявка обновлена')
    } else {
      payload = await applicationsStore.create(payload)
      ElMessage.success('Заявка создана')
    }
    emit('update:modelValue', false)
    emit('saved', payload)
  } catch (e) {
    // сообщения об ошибках уже показаны в store
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="record ? 'Редактирование заявки' : 'Новая заявка'"
    width="640px"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="150px">
      <el-form-item label="Объект" prop="objectId">
        <el-select v-model="form.objectId" filterable placeholder="Выберите объект" style="width: 100%">
          <el-option
            v-for="obj in objectsStore.items"
            :key="obj.id"
            :label="`${obj.name} (${obj.address})`"
            :value="obj.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Название" prop="title">
        <el-input v-model="form.title" placeholder="Например: Обрыв линии освещения на пр. Будённовском" />
      </el-form-item>

      <el-form-item label="Описание" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="4"
          placeholder="Опишите проблему: что обнаружено, где, кем"
        />
      </el-form-item>

      <el-form-item label="Приоритет">
        <el-select v-model="form.priority" style="width: 100%">
          <el-option v-for="p in PRIORITIES" :key="p.value" :label="p.label" :value="p.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="Срок устранения">
        <el-date-picker
          v-model="form.deadline"
          type="datetime"
          placeholder="Планируемая дата устранения"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="Фотографии">
        <div class="photo-list">
          <div v-for="(photo, index) in form.photos" :key="index" class="photo-item">
            <el-image :src="photo" fit="cover" class="photo-preview" />
            <el-button
              :icon="Delete"
              size="small"
              circle
              class="photo-remove"
              @click="form.photos.splice(index, 1)"
            />
          </div>
        </div>
        <div class="url-row">
          <el-input
            v-model="photoUrl"
            size="small"
            placeholder="Вставьте ссылку на фото в интернете (http/https)"
            @keyup.enter="addPhotoUrl"
          />
          <el-button size="small" type="primary" :icon="Plus" @click="addPhotoUrl">Добавить</el-button>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">Отмена</el-button>
      <el-button type="primary" :loading="saving" @click="submit">
        {{ record ? 'Сохранить' : 'Создать заявку' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.photo-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.photo-item {
  position: relative;
}

.photo-preview {
  width: 72px;
  height: 72px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  display: block;
}

.photo-remove {
  position: absolute;
  top: -10px;
  right: -10px;
}

.url-row {
  display: flex;
  gap: 6px;
  width: 100%;
}
</style>