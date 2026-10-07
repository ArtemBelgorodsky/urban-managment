<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import { useCatalogStore } from '../stores/catalog'
import { usersApi, divisionsApi, districtsApi } from '../api'
import { ROLES, ROLE_LABEL } from '../utils/constants'

const authStore = useAuthStore()
const catalogStore = useCatalogStore()

const activeTab = ref('users')

const userDialogVisible = ref(false)
const savingUser = ref(false)
const userForm = reactive({
  fullName: '',
  email: '',
  password: '',
  phone: '',
  role: 'specialist',
})

const divisionDialogVisible = ref(false)
const savingDivision = ref(false)
const editingDivisionId = ref(null)
const divisionForm = reactive({
  name: '',
  description: '',
  headUserId: null,
})

async function createUser() {
  if (!userForm.fullName || !userForm.email || userForm.password.length < 6) {
    ElMessage.warning('Заполните ФИО, email и пароль не короче 6 символов')
    return
  }
  savingUser.value = true
  try {
    await authStore.createUser({
      fullName: userForm.fullName,
      email: userForm.email,
      password: userForm.password,
      phone: userForm.phone || '',
      role: userForm.role,
    })
    ElMessage.success('Пользователь создан')
    userDialogVisible.value = false
    userForm.fullName = ''
    userForm.email = ''
    userForm.password = ''
    userForm.phone = ''
    userForm.role = 'specialist'
    await catalogStore.reload()
  } catch (e) {
    ElMessage.error(`Не удалось создать пользователя: ${e.message}`)
  } finally {
    savingUser.value = false
  }
}

async function changeRole(user, role) {
  try {
    await usersApi.update(user.id, { role })
    ElMessage.success(`Роль обновлена для ${user.fullName}`)
    await catalogStore.reload()
  } catch (e) {
    ElMessage.error(`Не удалось изменить роль: ${e.message}`)
    await catalogStore.reload()
  }
}

function openCreateDivision() {
  editingDivisionId.value = null
  divisionForm.name = ''
  divisionForm.description = ''
  divisionForm.headUserId = null
  divisionDialogVisible.value = true
}

function openEditDivision(division) {
  editingDivisionId.value = division.id
  divisionForm.name = division.name || ''
  divisionForm.description = division.description || ''
  divisionForm.headUserId = division.headUserId ?? null
  divisionDialogVisible.value = true
}

async function saveDivision() {
  if (!divisionForm.name.trim()) {
    ElMessage.warning('Укажите название подразделения')
    return
  }
  savingDivision.value = true
  const payload = {
    name: divisionForm.name.trim(),
    description: divisionForm.description.trim(),
    headUserId: divisionForm.headUserId ?? null,
  }
  try {
    if (editingDivisionId.value !== null) {
      await divisionsApi.update(editingDivisionId.value, payload)
      ElMessage.success('Подразделение обновлено')
    } else {
      await divisionsApi.create(payload)
      ElMessage.success('Подразделение создано')
    }
    divisionDialogVisible.value = false
    await catalogStore.reload()
  } catch (e) {
    ElMessage.error(`Ошибка: ${e.message}`)
  } finally {
    savingDivision.value = false
  }
}

async function deleteDivision(division) {
  await ElMessageBox.confirm(`Удалить подразделение «${division.name}»?`, 'Удаление', { type: 'warning' })
  try {
    await divisionsApi.remove(division.id)
    ElMessage.success('Подразделение удалено')
    await catalogStore.reload()
  } catch (e) {
    ElMessage.error(`Ошибка: ${e.message}`)
  }
}

async function deleteDistrict(district) {
  await ElMessageBox.confirm(`Удалить район «${district.name}»?`, 'Удаление', { type: 'warning' })
  try {
    await districtsApi.remove(district.id)
    ElMessage.success('Район удалён')
    await catalogStore.reload()
  } catch (e) {
    ElMessage.error(`Ошибка: ${e.message}`)
  }
}

const addingDistrict = ref(false)
const newDistrictName = ref('')
const newDistrictCoords = reactive({ lat: 47.2357, lng: 39.7013 })

async function addDistrict() {
  if (!newDistrictName.value.trim()) {
    ElMessage.warning('Укажите название района')
    return
  }
  try {
    await districtsApi.create({
      name: newDistrictName.value.trim(),
      centerLat: Number(newDistrictCoords.lat),
      centerLng: Number(newDistrictCoords.lng),
    })
    ElMessage.success('Район добавлен')
    newDistrictName.value = ''
    addingDistrict.value = false
    await catalogStore.reload()
  } catch (e) {
    ElMessage.error(`Ошибка: ${e.message}`)
  }
}

onMounted(async () => {
  await catalogStore.load()
})
</script>

<template>
  <div class="page">
    <el-card shadow="never">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="Пользователи" name="users">
          <div class="toolbar">
            <span class="text-muted">Пользователи системы и права доступа</span>
            <div class="spacer"></div>
            <el-button type="primary" :icon="Plus" @click="userDialogVisible = true">Добавить пользователя</el-button>
          </div>
          <el-table :data="catalogStore.users">
            <el-table-column prop="fullName" label="ФИО" min-width="200" />
            <el-table-column prop="email" label="Email" min-width="200" />
            <el-table-column prop="phone" label="Телефон" width="150" />
            <el-table-column label="Роль" width="220">
              <template #default="{ row }">
                <el-select
                  :model-value="row.role || 'specialist'"
                  size="small"
                  @change="(v) => changeRole(row, v)"
                >
                  <el-option v-for="r in ROLES" :key="r.value" :label="r.label" :value="r.value" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="Подразделение" width="180">
              <template #default="{ row }">{{ catalogStore.divisionById(row.divisionId)?.name || '—' }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="Подразделения" name="divisions">
          <div class="toolbar">
            <span class="text-muted">Структурные подразделения служб</span>
            <div class="spacer"></div>
            <el-button type="primary" :icon="Plus" @click="openCreateDivision">Добавить подразделение</el-button>
          </div>
          <el-table :data="catalogStore.divisions">
            <el-table-column prop="name" label="Название" min-width="200" />
            <el-table-column prop="description" label="Описание" min-width="260" show-overflow-tooltip />
            <el-table-column label="Руководитель" width="200">
              <template #default="{ row }">{{ catalogStore.userName(row.headUserId) }}</template>
            </el-table-column>
            <el-table-column label="Действия" width="150">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openEditDivision(row)">Изменить</el-button>
                <el-button link type="danger" size="small" @click="deleteDivision(row)">Удалить</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="Районы" name="districts">
          <div class="toolbar">
            <span class="text-muted">Районы города для фильтрации и аналитики</span>
            <div class="spacer"></div>
            <el-button v-if="!addingDistrict" type="primary" :icon="Plus" @click="addingDistrict = true">
              Добавить район
            </el-button>
          </div>
          <el-row v-if="addingDistrict" :gutter="8" class="mb-16">
            <el-col :span="6">
              <el-input v-model="newDistrictName" placeholder="Название района" />
            </el-col>
            <el-col :span="4">
              <el-input v-model.number="newDistrictCoords.lat" placeholder="Широта центра" />
            </el-col>
            <el-col :span="4">
              <el-input v-model.number="newDistrictCoords.lng" placeholder="Долгота центра" />
            </el-col>
            <el-col :span="4">
              <el-button type="primary" @click="addDistrict">Добавить</el-button>
              <el-button @click="addingDistrict = false">Отмена</el-button>
            </el-col>
          </el-row>
          <el-table :data="catalogStore.districts">
            <el-table-column prop="name" label="Название" min-width="220" />
            <el-table-column label="Центр (широта, долгота)" width="220">
              <template #default="{ row }">{{ row.centerLat }}, {{ row.centerLng }}</template>
            </el-table-column>
            <el-table-column label="Действия" width="100">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="deleteDistrict(row)">Удалить</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="userDialogVisible" title="Новый пользователь" width="460px">
      <el-form label-width="120px">
        <el-form-item label="ФИО">
          <el-input v-model="userForm.fullName" placeholder="Иванов Иван Иванович" />
        </el-form-item>
        <el-form-item label="Email">
          <el-input v-model="userForm.email" placeholder="user@example.com" />
        </el-form-item>
        <el-form-item label="Пароль">
          <el-input v-model="userForm.password" type="password" show-password placeholder="Минимум 6 символов" />
        </el-form-item>
        <el-form-item label="Телефон">
          <el-input v-model="userForm.phone" placeholder="+7 (900) 000-00-00" />
        </el-form-item>
        <el-form-item label="Роль">
          <el-select v-model="userForm.role" style="width: 100%">
            <el-option v-for="r in ROLES" :key="r.value" :label="r.label" :value="r.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">Отмена</el-button>
        <el-button type="primary" :loading="savingUser" @click="createUser">Создать</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="divisionDialogVisible"
      :title="editingDivisionId !== null ? 'Редактирование подразделения' : 'Новое подразделение'"
      width="480px"
    >
      <el-form label-width="130px">
        <el-form-item label="Название">
          <el-input v-model="divisionForm.name" placeholder="Например: Управление дорожного хозяйства" />
        </el-form-item>
        <el-form-item label="Описание">
          <el-input v-model="divisionForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="Руководитель">
          <el-select v-model="divisionForm.headUserId" clearable filterable style="width: 100%">
            <el-option v-for="u in catalogStore.users" :key="u.id" :label="u.fullName" :value="u.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="divisionDialogVisible = false">Отмена</el-button>
        <el-button type="primary" :loading="savingDivision" @click="saveDivision">
          {{ editingDivisionId !== null ? 'Сохранить' : 'Создать' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
