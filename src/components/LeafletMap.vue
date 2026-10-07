<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  OBJECT_TYPES,
  CONDITIONS,
  PRIORITIES,
  CONDITION_LABEL,
  OBJECT_TYPE_LABEL,
  STATUS_LABEL,
  PRIORITY_LABEL,
} from '../utils/constants'

const props = defineProps({
  objects: { type: Array, default: () => [] },
  applications: { type: Array, default: () => [] },
  showApplications: { type: Boolean, default: true },
  showObjects: { type: Boolean, default: true },
  canCreateApplication: { type: Boolean, default: true },
  height: { type: String, default: '560px' },
})

const emit = defineEmits(['open-object', 'open-application', 'create-application'])

const mapEl = ref(null)
let map = null
let objectLayer = null
let applicationLayer = null

const ROSTOV_CENTER = [47.2357, 39.7013]

function conditionColor(condition) {
  const item = CONDITIONS.find((c) => c.value === condition)
  return item ? item.color : '#909399'
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildPopup(node, actions) {
  const popup = document.createElement('div')
  popup.className = 'ug-popup'
  let html = node
  actions.forEach((action) => {
    html += `<button class="ug-popup-btn" data-action="${action.id}">${escapeHtml(action.label)}</button>`
  })
  popup.innerHTML = html
  actions.forEach((action) => {
    const btn = popup.querySelector(`[data-action="${action.id}"]`)
    if (btn) btn.addEventListener('click', action.handler)
  })
  return popup
}

function renderObjects() {
  if (!objectLayer) return
  objectLayer.clearLayers()
  if (!props.showObjects) return

  props.objects.forEach((obj) => {
    const lat = Number(obj.latitude)
    const lng = Number(obj.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

    const marker = L.circleMarker([lat, lng], {
      radius: 10,
      color: '#ffffff',
      weight: 2,
      fillColor: conditionColor(obj.condition),
      fillOpacity: 0.9,
    })

    const content = `
      <div style="min-width:200px">
        <div style="font-weight:600;margin-bottom:4px">${escapeHtml(obj.name)}</div>
        <div class="text-muted">${escapeHtml(OBJECT_TYPE_LABEL(obj.type))}</div>
        <div>Состояние: <span style="color:${conditionColor(obj.condition)};font-weight:600">${escapeHtml(
          CONDITION_LABEL(obj.condition)
        )}</span></div>
        <div>Адрес: ${escapeHtml(obj.address)}</div>
      </div>
    `
    const actions = []
    if (props.canCreateApplication) {
      actions.push({
        id: 'create',
        label: 'Создать заявку',
        handler: () => {
          emit('create-application', obj)
          map.closePopup()
        },
      })
      actions.push({
        id: 'open',
        label: 'Открыть',
        handler: () => {
          emit('open-object', obj)
          map.closePopup()
        },
      })
    }
    const popup = buildPopup(content, actions)
    marker.bindPopup(popup)
    objectLayer.addLayer(marker)
  })
}

function renderApplications() {
  if (!applicationLayer) return
  applicationLayer.clearLayers()
  if (!props.showApplications) return

  props.applications.forEach((app) => {
    const lat = Number(app.latitude)
    const lng = Number(app.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

    const priorityColor = (PRIORITIES.find((p) => p.value === app.priority) || {}).color || '#d03050'

    const marker = L.circleMarker([lat, lng], {
      radius: 14,
      color: priorityColor,
      weight: 3,
      fillColor: '#ffffff',
      fillOpacity: 0.35,
      dashArray: '4 3',
      className: 'ug-application-marker',
    })

    const content = `
      <div style="min-width:200px">
        <div style="font-weight:600;margin-bottom:4px">${escapeHtml(app.number || 'Заявка')}: ${escapeHtml(
          app.title
        )}</div>
        <div>Статус: ${escapeHtml(STATUS_LABEL(app.status))}</div>
        <div>Приоритет: <span style="color:${priorityColor};font-weight:600">${escapeHtml(
          PRIORITY_LABEL(app.priority)
        )}</span></div>
      </div>
    `
    const popup = buildPopup(content, [
      {
        id: 'open',
        label: 'Открыть заявку',
        handler: () => {
          emit('open-application', app)
          map.closePopup()
        },
      },
    ])
    marker.bindPopup(popup)
    applicationLayer.addLayer(marker)
  })
}

function fitAndRender() {
  renderObjects()
  renderApplications()

  const points = []
  if (props.showObjects) props.objects.forEach((o) => points.push([Number(o.latitude), Number(o.longitude)]))
  if (props.showApplications)
    props.applications.forEach((a) => points.push([Number(a.latitude), Number(a.longitude)]))

  if (points.length) {
    map.fitBounds(points, { padding: [40, 40], maxZoom: 15 })
  } else {
    map.setView(ROSTOV_CENTER, 12)
  }
}

function initMap() {
  if (!mapEl.value) return
  map = L.map(mapEl.value, {
    center: ROSTOV_CENTER,
    zoom: 12,
    scrollWheelZoom: true,
    // Подпись Leaflet/OpenStreetMap в правом нижнем углу не показываем
    attributionControl: false,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map)

  objectLayer = L.layerGroup().addTo(map)
  applicationLayer = L.layerGroup().addTo(map)

  fitAndRender()
}

onMounted(() => {
  initMap()
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})

watch(
  () => [props.objects, props.applications, props.showApplications, props.showObjects],
  () => {
    if (map) fitAndRender()
  },
  { deep: true }
)
</script>

<template>
  <div ref="mapEl" :style="{ height }" class="ug-map"></div>
</template>

<style scoped>
.ug-map {
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
}

:global(.ug-popup) {
  font-size: 13px;
  line-height: 1.5;
}

:global(.ug-popup-btn) {
  display: inline-block;
  margin: 6px 6px 0 0;
  padding: 4px 10px;
  border: 1px solid #409eff;
  border-radius: 4px;
  background: #ecf5ff;
  color: #409eff;
  cursor: pointer;
  font-size: 12px;
}

:global(.ug-popup-btn:hover) {
  background: #409eff;
  color: #fff;
}

:global(.ug-application-marker) {
  animation: ug-pulse 1.6s ease-in-out infinite;
}

@keyframes ug-pulse {
  0%,
  100% {
    opacity: 0.55;
  }
  50% {
    opacity: 1;
  }
}
</style>