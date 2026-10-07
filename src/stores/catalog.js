import { defineStore } from 'pinia'
import { districtsApi, divisionsApi, usersApi } from '../api'

export const useCatalogStore = defineStore('catalog', {
  state: () => ({
    districts: [],
    divisions: [],
    users: [],
    loaded: false,
    loading: false,
  }),

  getters: {
    districtById: (state) => (id) => state.districts.find((d) => String(d.id) === String(id)) || null,
    divisionById: (state) => (id) => state.divisions.find((d) => String(d.id) === String(id)) || null,
    userName: (state) => (id) => {
      const u = state.users.find((x) => String(x.id) === String(id))
      return u ? u.fullName : '—'
    },
    userNames: (state) => (ids) => {
      const names = (ids || [])
        .map((id) => state.users.find((x) => String(x.id) === String(id))?.fullName)
        .filter(Boolean)
      return names.length ? names.join(', ') : '—'
    },
    specialists: (state) => state.users.filter((u) => u.role === 'specialist'),
  },

  actions: {
    async load() {
      if (this.loading) return
      this.loading = true
      try {
        const settle = async (promise) => {
          try {
            const data = await promise
            return Array.isArray(data) ? data : data?.data || []
          } catch {
            return []
          }
        }
        const [districts, divisions] = await Promise.all([
          settle(districtsApi.list()),
          settle(divisionsApi.list()),
        ])
        this.districts = districts
        this.divisions = divisions
        this.loaded = true
        await this.loadUsers()
      } finally {
        this.loading = false
      }
    },

    async loadUsers() {
      try {
        const data = await usersApi.list()
        const rows = Array.isArray(data) ? data : data?.data || []
        this.users = rows.map((user) => ({
          ...user,
          role: user.role === 'employee' ? 'specialist' : user.role,
        }))
      } catch {
        this.users = []
      }
    },

    async reload() {
      this.loaded = false
      await this.load()
    },
  },
})
