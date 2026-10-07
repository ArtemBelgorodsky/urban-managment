import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true, title: 'Вход в систему' },
    },
    {
      path: '/',
      component: () => import('../views/LayoutView.vue'),
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
          meta: { title: 'Карта и сводка' },
        },
        {
          path: 'applications',
          name: 'applications',
          component: () => import('../views/ApplicationsView.vue'),
          meta: { title: 'Заявки' },
        },
        {
          path: 'applications/:id',
          name: 'application-detail',
          component: () => import('../views/ApplicationDetailView.vue'),
          meta: { title: 'Заявка' },
        },
        {
          path: 'objects',
          name: 'objects',
          component: () => import('../views/ObjectsView.vue'),
          meta: { title: 'Объекты инфраструктуры', forbidRoles: ['specialist'] },
        },
        {
          path: 'analytics',
          name: 'analytics',
          component: () => import('../views/AnalyticsView.vue'),
          meta: { title: 'Аналитика и отчёты', requireRoles: ['admin', 'head'] },
        },
        {
          path: 'admin',
          name: 'admin',
          component: () => import('../views/AdminView.vue'),
          meta: { title: 'Администрирование', requiresAdmin: true },
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.public) {
    if (auth.isAuthenticated && to.name === 'login') return { name: 'dashboard' }
    return true
  }
  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: 'dashboard' }
  }
  if (to.meta.forbidRoles?.includes(auth.role)) {
    return { name: 'applications' }
  }
  if (to.meta.requireRoles && !to.meta.requireRoles.includes(auth.role)) {
    return { name: 'applications' }
  }
  return true
})

export default router