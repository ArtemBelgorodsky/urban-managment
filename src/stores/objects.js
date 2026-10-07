import { defineStore } from 'pinia'
import { objectsApi } from '../api'
import { useAuthStore } from './auth'
import { ElMessage } from 'element-plus'

export const useObjectsStore = defineStore('objects', {
  state: () => ({
    items: [],
    loading: false,
    filters: {
      type: '',
      districtId: '',
      condition: '',
    },
  }),

  getters: {
    filtered: (state) =>
      state.items.filter((obj) => {
        if (state.filters.type && obj.type !== state.filters.type) return false
        if (state.filters.districtId && String(obj.districtId) !== String(state.filters.districtId)) return false
        if (state.filters.condition && obj.condition !== state.filters.condition) return false
        return true
      }),
    objectById: (state) => (id) => state.items.find((o) => String(o.id) === String(id)) || null,
    needsAttention: (state) => state.items.filter((o) => ['repair', 'emergency'].includes(o.condition)),
    conditionsStats: (state) => {
      const stats = { good: 0, fair: 0, repair: 0, emergency: 0 }
      state.items.forEach((o) => {
        if (stats[o.condition] !== undefined) stats[o.condition] += 1
      })
      return stats
    },
    typesStats: (state) => {
      const stats = {}
      state.items.forEach((o) => {
        stats[o.type] = (stats[o.type] || 0) + 1
      })
      return stats
    },
  },

  actions: {
    async fetch() {
      this.loading = true
      try {
        const data = await objectsApi.list()
        this.items = Array.isArray(data) ? data : data?.data || []
      } catch (e) {
        ElMessage.error(`Не удалось загрузить объекты: ${e.message}`)
        this.items = []
      } finally {
        this.loading = false
      }
    },

    assertCanEditObjects() {
      if (useAuthStore().role === 'specialist') {
        ElMessage.warning('Специалист не может изменять объекты инфраструктуры')
        throw new Error('У специалиста нет прав на изменение объектов')
      }
    },

    async create(payload) {
      this.assertCanEditObjects()
      try {
        const data = await objectsApi.create(payload)
        this.items.push(data)
        return data
      } catch (e) {
        ElMessage.error(`Не удалось создать объект: ${e.message}`)
        throw e
      }
    },

    async update(id, payload) {
      this.assertCanEditObjects()
      try {
        const data = await objectsApi.update(id, payload)
        const index = this.items.findIndex((o) => String(o.id) === String(id))
        if (index !== -1) this.items[index] = { ...this.items[index], ...data }
        return data
      } catch (e) {
        ElMessage.error(`Не удалось обновить объект: ${e.message}`)
        throw e
      }
    },

    async remove(id) {
      this.assertCanEditObjects()
      try {
        await objectsApi.remove(id)
        this.items = this.items.filter((o) => String(o.id) !== String(id))
      } catch (e) {
        ElMessage.error(`Не удалось удалить объект: ${e.message}`)
        throw e
      }
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
    },
  },
})