<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import { useCatalogStore } from '../stores/catalog'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const catalogStore = useCatalogStore()

const pageTitle = computed(() => route.meta.title || 'ГородИнфра')

const menuItems = computed(() => {
  if (authStore.role === 'specialist') {
    return [
      { path: '/', label: 'Карта и задачи', icon: 'MapLocation' },
      { path: '/applications', label: 'Мои заявки', icon: 'Tickets' },
    ]
  }
  const items = [
    { path: '/', label: 'Карта и сводка', icon: 'MapLocation' },
    { path: '/applications', label: 'Заявки', icon: 'Tickets' },
    { path: '/objects', label: 'Объекты', icon: 'OfficeBuilding' },
  ]
  if (authStore.isHead) {
    items.push({ path: '/analytics', label: 'Аналитика', icon: 'TrendCharts' })
  }
  if (authStore.isAdmin) {
    items.push({ path: '/admin', label: 'Администрирование', icon: 'Setting' })
  }
  return items
})

function logout() {
  authStore.logout()
  ElMessage.success('Вы вышли из системы')
  router.push('/login')
}

onMounted(() => {
  catalogStore.load()
})
</script>

<template>
  <el-container class="layout">
    <el-aside width="240px" class="sidebar">
      <div class="brand">
        <el-icon :size="28" color="#fff"><OfficeBuilding /></el-icon>
        <span class="brand-title">ГородИнфра</span>
      </div>
      <el-menu
        :default-active="route.path"
        router
        background-color="#1f2d3d"
        text-color="#c0c4cc"
        active-text-color="#fff"
        class="menu"
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header" height="60px">
        <h2 class="header-title">{{ pageTitle }}</h2>
        <div class="header-right">
          <el-dropdown trigger="click">
            <span class="user-chip">
              <el-avatar :size="32" class="user-avatar">{{ authStore.user?.fullName?.slice(0, 1) || '?' }}</el-avatar>
              <span class="user-name">{{ authStore.user?.fullName || 'Пользователь' }}</span>
              <el-tag size="small" type="info">{{ authStore.roleLabel }}</el-tag>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>{{ authStore.user?.email }}</el-dropdown-item>
                <el-dropdown-item divided @click="logout">Выйти</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main">
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout {
  height: 100vh;
}

.sidebar {
  background: #1f2d3d;
  display: flex;
  flex-direction: column;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 20px;
}

.brand-title {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.menu {
  border-right: none;
  flex: 1;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  font-size: 18px;
  color: #1f2d3d;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  outline: none;
}

.user-avatar {
  background: #409eff;
  color: #fff;
}

.user-name {
  font-size: 14px;
  color: #303133;
}

.main {
  overflow-y: auto;
  padding: 0;
}
</style>