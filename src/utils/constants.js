export const API_BASE = 'https://9e464d3475d6b355.mokky.dev'

export const OBJECT_TYPES = [
  { value: 'road', label: 'Дорога' },
  { value: 'sidewalk', label: 'Тротуар' },
  { value: 'traffic_light', label: 'Светофор' },
  { value: 'bus_stop', label: 'Остановка ОТ' },
  { value: 'lighting', label: 'Уличное освещение' },
  { value: 'children_playground', label: 'Детская площадка' },
  { value: 'sport_playground', label: 'Спортивная площадка' },
  { value: 'bridge', label: 'Мост' },
  { value: 'storm_drain', label: 'Ливневая канализация' },
  { value: 'green_zone', label: 'Зелёная зона' },
]

export const CONDITIONS = [
  { value: 'good', label: 'Хорошее', color: '#67c23a' },
  { value: 'fair', label: 'Удовлетворительное', color: '#e6a23c' },
  { value: 'repair', label: 'Требует ремонта', color: '#f56c6c' },
  { value: 'emergency', label: 'Аварийное', color: '#d03050' },
]

export const PRIORITIES = [
  { value: 'low', label: 'Низкий', color: '#909399' },
  { value: 'medium', label: 'Средний', color: '#e6a23c' },
  { value: 'high', label: 'Высокий', color: '#f56c6c' },
  { value: 'critical', label: 'Критический', color: '#d03050' },
]

export const STATUSES = [
  { value: 'new', label: 'Новая', color: '#409eff' },
  { value: 'assigned', label: 'Назначена', color: '#e6a23c' },
  { value: 'in_progress', label: 'В работе', color: '#9254de' },
  { value: 'done', label: 'Выполнена', color: '#67c23a' },
  { value: 'closed', label: 'Закрыта', color: '#909399' },
]

export const ACTIVE_STATUSES = ['new', 'assigned', 'in_progress']

export const ROLES = [
  { value: 'admin', label: 'Администратор' },
  { value: 'head', label: 'Руководитель' },
  { value: 'specialist', label: 'Специалист' },
]

export function labelOf(list, value, fallback = '—') {
  const item = list.find((i) => i.value === value)
  return item ? item.label : fallback
}

export function colorOf(list, value, fallback = '#909399') {
  const item = list.find((i) => i.value === value)
  return item ? item.color : fallback
}

export const OBJECT_TYPE_LABEL = (v) => labelOf(OBJECT_TYPES, v)
export const CONDITION_LABEL = (v) => labelOf(CONDITIONS, v)
export const CONDITION_COLOR = (v) => colorOf(CONDITIONS, v)
export const PRIORITY_LABEL = (v) => labelOf(PRIORITIES, v)
export const PRIORITY_COLOR = (v) => colorOf(PRIORITIES, v)
export const STATUS_LABEL = (v) => labelOf(STATUSES, v)
export const STATUS_COLOR = (v) => colorOf(STATUSES, v)
export const ROLE_LABEL = (v) => labelOf(ROLES, v)
