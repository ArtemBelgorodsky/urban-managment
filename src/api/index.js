import { request } from './http'

export const authApi = {
  register: (payload) => request('/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),
}

function collection(name) {
  return {
    list: (params) => request(`/${name}`, { params }),
    get: (id) => request(`/${name}/${id}`),
    create: (data) => request(`/${name}`, { method: 'POST', body: data }),
    update: (id, data) => request(`/${name}/${id}`, { method: 'PATCH', body: data }),
    remove: (id) => request(`/${name}/${id}`, { method: 'DELETE' }),
  }
}

export const usersApi = collection('users')

export async function registerUser(payload) {
  return authApi.register(payload)
}
export const divisionsApi = collection('divisions')
export const districtsApi = collection('districts')
export const objectsApi = collection('infrastructure_objects')
export const applicationsApi = collection('applications')
export const historyApi = collection('application_history')
export const worksApi = collection('works')