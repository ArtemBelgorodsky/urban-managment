import { defineStore } from 'pinia'
import { authApi, usersApi, registerUser } from '../api'
import { getToken, setToken } from '../api/http'
import { ROLE_LABEL } from '../utils/constants'

const USER_KEY = 'urban_user'

function readUser() {
  try {
    return publicUser(JSON.parse(localStorage.getItem(USER_KEY) || 'null'))
  } catch {
    return null
  }
}

function publicUser(user) {
  const { password, ...safe } = user || {}
  if (safe.role === 'employee') safe.role = 'specialist'
  return safe
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: getToken(),
    user: readUser(),
    loading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    role: (state) => state.user?.role || 'specialist',
    isAdmin: (state) => state.user?.role === 'admin',
    isHead: (state) => ['admin', 'head'].includes(state.user?.role),
    isSpecialist: (state) => ['admin', 'head', 'specialist'].includes(state.user?.role),
    roleLabel: (state) => ROLE_LABEL(state.user?.role) || ROLE_LABEL('specialist'),
  },

  actions: {
    persist() {
      localStorage.setItem(USER_KEY, JSON.stringify(publicUser(this.user)))
    },

    setLocalSession(id) {
      this.token = `local-${id}-${Date.now()}`
      setToken(this.token)
      this.persist()
    },

    async tryDirectLogin(email, password) {
      try {
        const list = await usersApi.list({ limit: 1000 })
        const rows = Array.isArray(list) ? list : list?.data || []
        const normalized = String(email || '').toLowerCase().trim()
        const found = rows.find((u) => String(u.email || '').toLowerCase().trim() === normalized)
        if (found && found.password && found.password === password) {
          this.user = publicUser(found)
          this.setLocalSession(found.id)
          return true
        }
      } catch {
        // коллекция users может отсутствовать — пробуем /auth
      }
      return false
    },

    async login(email, password) {
      this.loading = true
      try {
        let lastError = null
        try {
          const res = await authApi.login({ email, password })
          if (res?.token) {
            this.token = res.token
            this.user = publicUser(res.data)
            setToken(this.token)
            this.persist()
            await this.syncProfile()
            return
          }
          lastError = new Error('Не удалось получить токен')
        } catch (e) {
          lastError = e
        }
        if (await this.tryDirectLogin(email, password)) return
        throw lastError || new Error('Неверный email или пароль')
      } finally {
        this.loading = false
      }
    },

    async register(payload) {
      this.loading = true
      try {
        const res = await registerUser({
          fullName: payload.fullName,
          email: payload.email,
          password: payload.password,
          phone: payload.phone || '',
          role: payload.role || 'specialist',
          divisionId: payload.divisionId ?? null,
        })
        if (res?.token) {
          this.token = res.token
          this.user = publicUser(res.data)
          setToken(this.token)
          this.persist()
        } else {
          await this.login(payload.email, payload.password)
        }
        await this.syncProfile()
      } finally {
        this.loading = false
      }
    },

    async createUser(payload) {
      const res = await registerUser({
        fullName: payload.fullName,
        email: payload.email,
        password: payload.password,
        phone: payload.phone || '',
        role: payload.role || 'specialist',
        divisionId: payload.divisionId ?? null,
      })
      return res?.data || res
    },

    async syncProfile() {
      try {
        const list = await usersApi.list({ limit: 1000 })
        const rows = Array.isArray(list) ? list : list?.data || []
        const email = String(this.user?.email || '').toLowerCase().trim()
        const found = rows.find((u) => String(u.email || '').toLowerCase().trim() === email)
        if (found && found.id !== undefined) {
          this.user = publicUser(found)
        }
        this.persist()
      } catch {
        // коллекция users может отсутствовать — не критично
      }
    },

    async refreshProfile() {
      try {
        const me = await authApi.me()
        if (me) {
          this.user = publicUser({ ...(this.user || {}), ...me })
          this.persist()
        }
      } catch {
        // токен мог устареть
      }
    },

    logout() {
      this.token = ''
      this.user = null
      setToken('')
      localStorage.removeItem(USER_KEY)
    },
  },
})
