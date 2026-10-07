<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import { useCatalogStore } from '../stores/catalog'
import { ROLES, OBJECT_TYPES, CONDITIONS, PRIORITIES } from '../utils/constants'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const catalogStore = useCatalogStore()

const mode = ref('login')
const formRef = ref(null)

const loginForm = reactive({
  email: '',
  password: '',
})

const registerForm = reactive({
  fullName: '',
  email: '',
  password: '',
  confirm: '',
  phone: '',
  role: 'specialist',
})

const loginRules = {
  email: [
    { required: true, message: 'Введите email', trigger: 'blur' },
    { type: 'email', message: 'Некорректный email', trigger: 'blur' },
  ],
  password: [{ required: true, message: 'Введите пароль', trigger: 'blur' }],
}

const registerRules = {
  fullName: [{ required: true, message: 'Введите ФИО', trigger: 'blur' }],
  email: [
    { required: true, message: 'Введите email', trigger: 'blur' },
    { type: 'email', message: 'Некорректный email', trigger: 'blur' },
  ],
  password: [
    { required: true, message: 'Придумайте пароль', trigger: 'blur' },
    { min: 6, message: 'Минимум 6 символов', trigger: 'blur' },
  ],
  confirm: [
    {
      validator: (_, value, cb) => {
        if (value !== registerForm.password) cb(new Error('Пароли не совпадают'))
        else cb()
      },
      trigger: 'blur',
    },
  ],
}

async function submitLogin() {
  await formRef.value.validate()
  try {
    await authStore.login(loginForm.email, loginForm.password)
    ElMessage.success('Вход выполнен')
    await catalogStore.load()
    router.push(route.query.redirect || '/')
  } catch (e) {
    ElMessage.error(`Не удалось войти: ${e.message}`)
  }
}

async function submitRegister() {
  await formRef.value.validate()
  try {
    await authStore.register({
      fullName: registerForm.fullName,
      email: registerForm.email,
      password: registerForm.password,
      phone: registerForm.phone || '',
      role: registerForm.role,
    })
    ElMessage.success('Регистрация прошла успешно')
    await catalogStore.load()
    router.push('/', { replace: true })
  } catch (e) {
    ElMessage.error(`Не удалось зарегистрироваться: ${e.message}`)
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <el-icon :size="40" color="#409eff"><OfficeBuilding /></el-icon>
        <h1>ГородИнфра</h1>
        <p class="text-muted">Управление городской инфраструктурой</p>
      </div>

      <el-tabs v-model="mode" stretch>
        <el-tab-pane label="Вход" name="login">
          <el-form
            ref="formRef"
            :model="loginForm"
            :rules="loginRules"
            label-position="top"
            @keyup.enter="submitLogin"
          >
            <el-form-item label="Email" prop="email">
              <el-input v-model="loginForm.email" placeholder="user@example.com">
                <template #prefix><el-icon><Message /></el-icon></template>
              </el-input>
            </el-form-item>
            <el-form-item label="Пароль" prop="password">
              <el-input v-model="loginForm.password" type="password" show-password placeholder="••••••">
                <template #prefix><el-icon><Lock /></el-icon></template>
              </el-input>
            </el-form-item>
            <el-button type="primary" class="submit-btn" :loading="authStore.loading" @click="submitLogin">
              Войти
            </el-button>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="Регистрация" name="register">
          <el-form
            :model="registerForm"
            :rules="registerRules"
            label-position="top"
            @keyup.enter="submitRegister"
          >
            <el-form-item label="ФИО" prop="fullName">
              <el-input v-model="registerForm.fullName" placeholder="Иванов Иван Иванович" />
            </el-form-item>
            <el-form-item label="Email" prop="email">
              <el-input v-model="registerForm.email" placeholder="user@example.com" />
            </el-form-item>
            <el-form-item label="Пароль" prop="password">
              <el-input v-model="registerForm.password" type="password" show-password placeholder="Минимум 6 символов" />
            </el-form-item>
            <el-form-item label="Повтор пароля" prop="confirm">
              <el-input v-model="registerForm.confirm" type="password" show-password placeholder="Повторите пароль" />
            </el-form-item>
            <el-form-item label="Телефон">
              <el-input v-model="registerForm.phone" placeholder="+7 (900) 000-00-00" />
            </el-form-item>
            <el-form-item label="Роль в системе">
              <el-select v-model="registerForm.role" style="width: 100%">
                <el-option v-for="r in ROLES" :key="r.value" :label="r.label" :value="r.value" />
              </el-select>
            </el-form-item>
            <el-button type="primary" class="submit-btn" :loading="authStore.loading" @click="submitRegister">
              Зарегистрироваться
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <el-alert type="info" :closable="false" class="mt-16">
        <p>
          Для демонстрации зарегистрируйте несколько пользователей с разными ролями:
          администратор, руководитель, специалист.
        </p>
      </el-alert>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1f4e79 0%, #2f6fae 60%, #4a90d9 100%);
  padding: 24px;
}

.login-card {
  width: 440px;
  max-width: 100%;
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
}

.login-header {
  text-align: center;
  margin-bottom: 16px;
}

.login-header h1 {
  font-size: 24px;
  margin-top: 8px;
  color: #1f2d3d;
}

.submit-btn {
  width: 100%;
  margin-top: 4px;
}
</style>
