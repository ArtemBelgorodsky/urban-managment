<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  latitude: { type: [Number, String], default: null },
  longitude: { type: [Number, String], default: null },
  // Запасной центр карты, если координаты ещё не указаны: [широта, долгота]
  center: { type: Array, default: null },
  height: { type: String, default: '260px' },
})

const emit = defineEmits(['update:latitude', 'update:longitude', 'pick'])

const ROSTOV_CENTER = [47.2357, 39.7013]
const CITY_ZOOM = 12
const PICK_ZOOM = 16

const mapEl = ref(null)
let map = null
let marker = null
let resizeObserver = null

const pinIcon = L.divIcon({
  className: 'ug-pin',
  html: '<span class="ug-pin-inner"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

function toNumber(value) {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  if (!text) return null
  const num = Number(text)
  return Number.isFinite(num) ? num : null
}

function toPoint(lat, lng) {
  const a = toNumber(lat)
  const b = toNumber(lng)
  if (a === null || b === null) return null
  if (a < -90 || a > 90 || b < -180 || b > 180) return null
  // 0,0 — это «координаты не заданы», а не точка в Атлантике
  if (a === 0 && b === 0) return null
  return [a, b]
}

const currentPoint = () => toPoint(props.latitude, props.longitude)

function fallbackCenter() {
  const c = toPoint(props.center?.[0], props.center?.[1])
  return c || ROSTOV_CENTER
}

function placeMarker(point) {
  if (!map) return
  if (!point) {
    if (marker) {
      map.removeLayer(marker)
      marker = null
    }
    return
  }
  if (!marker) {
    marker = L.marker(point, { draggable: true, icon: pinIcon, keyboard: false }).addTo(map)
    marker.on('dragend', () => applyPoint(marker.getLatLng(), { pan: false }))
  } else {
    marker.setLatLng(point)
  }
}

function applyPoint(latlng, { pan = true } = {}) {
  const point = [Number(latlng.lat.toFixed(6)), Number(latlng.lng.toFixed(6))]
  emit('update:latitude', point[0])
  emit('update:longitude', point[1])
  emit('pick', point)
  placeMarker(point)
  if (pan && map) map.panTo(point)
}

function initMap() {
  if (!mapEl.value) return
  const point = currentPoint()
  map = L.map(mapEl.value, {
    center: point || fallbackCenter(),
    zoom: point ? PICK_ZOOM : CITY_ZOOM,
    scrollWheelZoom: true,
    // Подпись Leaflet/OpenStreetMap в правом нижнем углу не показываем
    attributionControl: false,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map)

  map.on('click', (e) => applyPoint(e.latlng))
  placeMarker(point)

  // Диалог появляется с анимацией, поэтому размер карты нужно пересчитать после открытия
  const invalidate = () => map && map.invalidateSize()
  resizeObserver = new ResizeObserver(invalidate)
  resizeObserver.observe(mapEl.value)
  ;[60, 200, 400].forEach((delay) => setTimeout(invalidate, delay))
}

onMounted(() => {
  nextTick(() => initMap())
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (map) {
    map.remove()
    map = null
    marker = null
  }
})

watch(
  () => [props.latitude, props.longitude, props.center],
  () => {
    if (!map) return
    const point = currentPoint()
    placeMarker(point)
    if (point) {
      const zoom = map.getZoom() < PICK_ZOOM - 2 ? PICK_ZOOM : map.getZoom()
      map.setView(point, zoom, { animate: false })
    }
  }
)
</script>

<template>
  <div class="point-picker">
    <div ref="mapEl" :style="{ height }" class="point-map"></div>
    <div class="point-hint">
      Кликните по карте, чтобы подставить координаты, — маркер можно перетащить.
    </div>
  </div>
</template>

<style scoped>
.point-picker {
  width: 100%;
}

.point-map {
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
  cursor: crosshair;
}

.point-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
}

:global(.ug-pin) {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(64, 158, 255, 0.25);
}

:global(.ug-pin-inner) {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #409eff;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
}
</style>
