<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useObjectsStore } from '../stores/objects'
import { useCatalogStore } from '../stores/catalog'
import MapPointPicker from './MapPointPicker.vue'
import { OBJECT_TYPES, CONDITIONS } from '../utils/constants'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  record: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const objectsStore = useObjectsStore()
const catalogStore = useCatalogStore()

const formRef = ref(null)
const saving = ref(false)

const form = ref({
  name: '',
  type: 'road',
  districtId: null,
  address: '',
  latitude: '',
  longitude: '',
  condition: 'good',
  commissioningDate: '',
  characteristics: '',
  description: '',
})

const rules = {
  name: [{ required: true, message: 'Укажите название объекта', trigger: 'blur' }],
  type: [{ required: true, message: 'Выберите тип', trigger: 'change' }],
  districtId: [{ required: true, message: 'Выберите район', trigger: 'change' }],
  address: [{ required: true, message: 'Укажите адрес', trigger: 'blur' }],
  latitude: [{ required: true, message: 'Укажите широту', trigger: 'blur' }],
  longitude: [{ required: true, message: 'Укажите долготу', trigger: 'blur' }],
}

const pickedPoint = computed(() => {
  const lat = Number(form.value.latitude)
  const lng = Number(form.value.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return null
  return [lat, lng]
})

// Центр выбранного района — чтобы карта открывалась в нужной части города
const districtCenter = computed(() => {
  const district = catalogStore.districtById(form.value.districtId)
  const lat = Number(district?.centerLat)
  const lng = Number(district?.centerLng)
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null
})

// Ближайший к выбранной точке район — подсказка, чтобы не искать его вручную
const nearestDistrict = computed(() => {
  const point = pickedPoint.value
  if (!point) return null
  const [lat, lng] = point
  let best = null
  let bestDistance = Infinity
  catalogStore.districts.forEach((district) => {
    const dLat = Number(district.centerLat)
    const dLng = Number(district.centerLng)
    if (!Number.isFinite(dLat) || !Number.isFinite(dLng)) return
    const dx = (dLng - lng) * Math.cos((lat * Math.PI) / 180)
    const dy = dLat - lat
    const distance = dx * dx + dy * dy
    if (distance < bestDistance) {
      bestDistance = distance
      best = district
    }
  })
  return best
})

const districtSuggestion = computed(() => {
  const district = nearestDistrict.value
  if (!district || String(district.id) === String(form.value.districtId)) return null
  return district
})

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return
    if (!catalogStore.loaded) catalogStore.load()
    if (props.record) {
      const r = props.record
      form.value = {
        name: r.name || '',
        type: r.type || 'road',
        districtId: r.districtId ?? null,
        address: r.address || '',
        latitude: r.latitude ?? '',
        longitude: r.longitude ?? '',
        condition: r.condition || 'good',
        commissioningDate: r.commissioningDate || '',
        characteristics: r.characteristics ? JSON.stringify(r.characteristics, null, 2) : '',
        description: r.description || '',
      }
    } else {
      form.value = {
        name: '',
        type: 'road',
        districtId: null,
        address: '',
        latitude: '',
        longitude: '',
        condition: 'good',
        commissioningDate: '',
        characteristics: '',
        description: '',
      }
    }
  }
)

function parseCharacteristics() {
  const text = form.value.characteristics.trim()
  if (!text) return {}
  try {
    const parsed = JSON.parse(text)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    ElMessage.warning('Характеристики не распознаны как JSON — сохраню как текст')
    return { raw: text }
  }
}

async function submit() {
  await formRef.value.validate()
  saving.value = true
  try {
    const payload = {
      name: form.value.name,
      type: form.value.type,
      districtId: form.value.districtId,
      address: form.value.address,
      latitude: Number(form.value.latitude),
      longitude: Number(form.value.longitude),
      condition: form.value.condition,
      commissioningDate: form.value.commissioningDate || null,
      characteristics: parseCharacteristics(),
      description: form.value.description || '',
    }
    if (props.record) {
      await objectsStore.update(props.record.id, payload)
      ElMessage.success('Объект обновлён')
    } else {
      payload.latitude = Number(payload.latitude)
      payload.longitude = Number(payload.longitude)
      await objectsStore.create(payload)
      ElMessage.success('Объект создан')
    }
    emit('update:modelValue', false)
    emit('saved')
  } catch {
    // сообщения уже показаны в store
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="record ? 'Редактирование объекта' : 'Новый объект инфраструктуры'"
    width="680px"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="150px">
      <el-form-item label="Название" prop="name">
        <el-input v-model="form.name" placeholder="Например: ул. Пушкинская, 45 (дорожное полотно)" />
      </el-form-item>

      <el-form-item label="Тип объекта" prop="type">
        <el-select v-model="form.type" style="width: 100%">
          <el-option v-for="t in OBJECT_TYPES" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="Район" prop="districtId">
        <el-select v-model="form.districtId" filterable placeholder="Выберите район" style="width: 100%">
          <el-option v-for="d in catalogStore.districts" :key="d.id" :label="d.name" :value="d.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Адрес" prop="address">
        <el-input v-model="form.address" placeholder="Например: пр. Будённовский, 80" />
      </el-form-item>

      <el-form-item label="Координаты" required>
        <div class="coords-row">
          <el-input v-model="form.latitude" placeholder="Широта, напр. 47.2357" />
          <el-input v-model="form.longitude" placeholder="Долгота, напр. 39.7013" />
        </div>
        <div class="text-muted mt-8">
          Укажите координаты вручную или просто кликните по карте ниже. Координаты Ростова:
          47.2–47.3 широта, 39.6–39.8 долгота.
        </div>
        <MapPointPicker
          v-if="modelValue"
          v-model:latitude="form.latitude"
          v-model:longitude="form.longitude"
          :center="districtCenter"
          class="mt-8"
        />
        <div v-if="districtSuggestion" class="text-muted mt-8">
          Ближайший район: <b>{{ districtSuggestion.name }}</b>.
          <el-button link type="primary" size="small" @click="form.districtId = districtSuggestion.id">
            Подставить
          </el-button>
        </div>
      </el-form-item>

      <el-form-item label="Состояние">
        <el-select v-model="form.condition" style="width: 100%">
          <el-option v-for="c in CONDITIONS" :key="c.value" :label="c.label" :value="c.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="Ввод в эксплуатацию">
        <el-date-picker
          v-model="form.commissioningDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="Дата ввода в эксплуатацию"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="Характеристики">
        <el-input
          v-model="form.characteristics"
          type="textarea"
          :rows="3"
          placeholder='JSON, например: {"протяжённость": "1.2 км", "покрытие": "асфальт"}'
        />
      </el-form-item>

      <el-form-item label="Описание">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="Дополнительное описание" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">Отмена</el-button>
      <el-button type="primary" :loading="saving" @click="submit">
        {{ record ? 'Сохранить' : 'Создать' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.coords-row {
  display: flex;
  gap: 8px;
  width: 100%;
}
</style>