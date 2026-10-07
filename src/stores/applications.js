import { defineStore } from 'pinia'
import { applicationsApi, historyApi, worksApi } from '../api'
import { useAuthStore } from './auth'
import { ElMessage } from 'element-plus'

function nowISO() {
  return new Date().toISOString()
}

export function applicationAssigneeIds(application) {
  const ids = Array.isArray(application?.assigneeIds)
    ? application.assigneeIds
    : application?.assigneeId !== undefined && application?.assigneeId !== null
      ? [application.assigneeId]
      : []
  return [...new Set(ids.map((id) => String(id)))]
}

export function isApplicationAssignedTo(application, userId) {
  if (userId === undefined || userId === null) return false
  return applicationAssigneeIds(application).includes(String(userId))
}

export const useApplicationsStore = defineStore('applications', {
  state: () => ({
    items: [],
    current: null,
    history: [],
    works: [],
    loading: false,
    detailLoading: false,
    filters: {
      status: '',
      priority: '',
      districtId: '',
    },
  }),

  getters: {
    openCount: (state) => state.items.filter((a) => ['new', 'assigned', 'in_progress'].includes(a.status)).length,
    inProgressCount: (state) => state.items.filter((a) => a.status === 'in_progress').length,
    doneCount: (state) => state.items.filter((a) => a.status === 'done').length,
    statusStats: (state) => {
      const stats = { new: 0, assigned: 0, in_progress: 0, done: 0, closed: 0 }
      state.items.forEach((a) => {
        if (stats[a.status] !== undefined) stats[a.status] += 1
      })
      return stats
    },
    priorityStats: (state) => {
      const stats = { low: 0, medium: 0, high: 0, critical: 0 }
      state.items.forEach((a) => {
        if (stats[a.priority] !== undefined) stats[a.priority] += 1
      })
      return stats
    },
    activeApplications: (state) => state.items.filter((a) => ['new', 'assigned', 'in_progress'].includes(a.status)),
  },

  actions: {
    async fetch() {
      this.loading = true
      try {
        const auth = useAuthStore()
        const params = {}
        if (this.filters.status) params.status = this.filters.status
        if (this.filters.priority) params.priority = this.filters.priority
        const data = await applicationsApi.list(params)
        const rows = Array.isArray(data) ? data : data?.data || []
        this.items =
          auth.role === 'specialist'
            ? rows.filter((a) => isApplicationAssignedTo(a, auth.user?.id))
            : rows
      } catch (e) {
        ElMessage.error(`Не удалось загрузить заявки: ${e.message}`)
        this.items = []
      } finally {
        this.loading = false
      }
    },

    async fetchAll() {
      this.loading = true
      try {
        const data = await applicationsApi.list()
        this.items = Array.isArray(data) ? data : data?.data || []
      } catch (e) {
        ElMessage.error(`Не удалось загрузить заявки: ${e.message}`)
        this.items = []
      } finally {
        this.loading = false
      }
    },

    async fetchOne(id) {
      this.detailLoading = true
      try {
        const [application, historyRows, workRows] = await Promise.all([
          applicationsApi.get(id),
          historyApi.list({ applicationId: id }),
          worksApi.list({ applicationId: id }),
        ])
        this.current = application
        this.history = (Array.isArray(historyRows) ? historyRows : historyRows?.data || []).sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        )
        this.works = Array.isArray(workRows) ? workRows : workRows?.data || []
      } catch (e) {
        ElMessage.error(`Не удалось загрузить заявку: ${e.message}`)
      } finally {
        this.detailLoading = false
      }
    },

    async create(payload) {
      const auth = useAuthStore()
      if (auth.role === 'specialist') {
        ElMessage.warning('Специалист не может создавать заявки')
        throw new Error('У специалиста нет прав на создание заявок')
      }
      try {
        const data = await applicationsApi.create({
          ...payload,
          status: 'new',
          reporterId: auth.user?.id,
          createdAt: nowISO(),
          photos: payload.photos || [],
        })
        const number = `З-${new Date().getFullYear()}-${String(data.id).padStart(4, '0')}`
        try {
          const updated = await applicationsApi.update(data.id, { number })
          data.number = updated.number || number
        } catch {
          data.number = number
        }
        data.number = data.number || number
        await this.addHistory(data.id, 'created', 'Заявка создана', null, 'new', auth.user?.id)
        this.items.unshift(data)
        return data
      } catch (e) {
        ElMessage.error(`Не удалось создать заявку: ${e.message}`)
        throw e
      }
    },

    async update(id, payload) {
      try {
        const data = await applicationsApi.update(id, payload)
        const index = this.items.findIndex((a) => String(a.id) === String(id))
        if (index !== -1) this.items[index] = { ...this.items[index], ...data }
        if (this.current && String(this.current.id) === String(id)) this.current = { ...this.current, ...data }
        return data
      } catch (e) {
        ElMessage.error(`Не удалось обновить заявку: ${e.message}`)
        throw e
      }
    },

    async addHistory(applicationId, action, description, statusFrom, statusTo, userId) {
      try {
        await historyApi.create({
          applicationId,
          action,
          description: description || '',
          statusFrom: statusFrom || null,
          statusTo: statusTo || null,
          userId: userId !== undefined ? userId : useAuthStore().user?.id,
          createdAt: nowISO(),
        })
      } catch (e) {
        ElMessage.warning(`История не сохранена: ${e.message}`)
      }
    },

    async assign(id, { assigneeIds, assigneeId, divisionId, comment }) {
      const prev = this.items.find((a) => String(a.id) === String(id))
      const prevStatus = prev?.status || 'new'
      const ids = assigneeIds?.length ? assigneeIds : assigneeId !== undefined && assigneeId !== null ? [assigneeId] : []
      const data = await this.update(id, {
        assigneeIds: ids.map((id) => Number(id) || id),
        assigneeId: null,
        divisionId,
        status: 'assigned',
        comment: comment || '',
      })
      await this.addHistory(id, 'assigned', comment || 'Назначен исполнитель', prevStatus, 'assigned')
      if (this.current && String(this.current.id) === String(id)) {
        await this.fetchOne(id)
      }
      return data
    },

    async start(id, comment) {
      const data = await this.update(id, { status: 'in_progress', comment: comment || '' })
      await this.addHistory(id, 'started', comment || 'Работы начаты', 'assigned', 'in_progress')
      return data
    },

    async complete(id, work) {
      const data = await this.update(id, {
        status: 'done',
        resolvedAt: nowISO(),
        comment: work?.comment || '',
      })
      try {
        await worksApi.create({
          applicationId: id,
          objectId: work?.objectId || data.objectId,
          executorId: work?.executorId || useAuthStore().user?.id,
          title: work?.title || 'Выполнение работ по заявке',
          description: work?.description || '',
          startedAt: work?.startedAt || data.createdAt,
          finishedAt: nowISO(),
          materials: work?.materials || '',
          result: work?.result || '',
        })
      } catch (e) {
        ElMessage.warning(`Акт работ не сохранён: ${e.message}`)
      }
      await this.addHistory(id, 'completed', work?.result || 'Заявка выполнена', 'in_progress', 'done')
      return data
    },

    async close(id, comment) {
      const data = await this.update(id, { status: 'closed', comment: comment || '' })
      await this.addHistory(id, 'closed', comment || 'Заявка закрыта', 'done', 'closed')
      return data
    },

    async addComment(id, text) {
      if (!text?.trim()) return
      await this.addHistory(id, 'commented', text.trim(), null, null)
    },
  },
})
