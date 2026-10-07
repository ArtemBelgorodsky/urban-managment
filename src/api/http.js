import { API_BASE } from '../utils/constants'

const TOKEN_KEY = 'urban_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export async function request(
  path,
  { method = 'GET', body, params, rawError = false, timeout = 12000 } = {}
) {
  const url = new URL(API_BASE + path)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value)
      }
    })
  }

  // Коллекции Mokky не защищены — токен авторизации в запросы не отправляется.
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  let res
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Сервер не ответил (таймаут)')
    throw e
  } finally {
    clearTimeout(timer)
  }

  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!res.ok) {
    const message =
      data && typeof data === 'object' && (data.error || data.message)
        ? String(data.error || data.message)
        : `Ошибка запроса (${res.status})`
    if (rawError) {
      data = { ...data, status: res.status }
      return data
    }
    throw new Error(message)
  }

  return data
}