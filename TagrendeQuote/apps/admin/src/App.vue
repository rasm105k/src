<script setup lang="ts">
import L from 'leaflet'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { getGatewayUrl, getQuote, listQuotes } from './api'
import type { QuoteRecord } from './types'

const quotes = ref<QuoteRecord[]>([])
const selected = ref<QuoteRecord | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const mapElement = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let polygonLayer: L.Polygon | null = null

// Estimate editing state
const editingEstimate = ref(false)
const editPriceMin = ref(0)
const editPriceMax = ref(0)
const editBuildingArea = ref(0)
const editFloors = ref(0)
const editGutterMeters = ref(0)
const editConfidence = ref(0)

const selectedPrice = computed(() => {
  if (!selected.value) return '-'
  const verified = selected.value.verified?.priceDkk
  if (verified) return formatDkk(verified)
  return `${formatDkk(selected.value.estimate.price.min)}-${formatDkk(selected.value.estimate.price.max)}`
})

onMounted(async () => {
  await refreshQuotes()
})

watch(selected, async () => {
  await nextTick()
  renderMap()
  // Populate edit fields when quote is selected
  if (selected.value) {
    editPriceMin.value = selected.value.estimate.price.min
    editPriceMax.value = selected.value.estimate.price.max
    editBuildingArea.value = selected.value.estimate.facts.buildingAreaM2
    editFloors.value = selected.value.estimate.facts.floors
    editGutterMeters.value = selected.value.estimate.facts.estimatedGutterMeters
    editConfidence.value = selected.value.estimate.confidence
  }
})

async function refreshQuotes() {
  loading.value = true
  error.value = null
  try {
    quotes.value = await listQuotes()
    if (!selected.value && quotes.value.length > 0) {
      selected.value = quotes.value[0]
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Ukendt fejl.'
  } finally {
    loading.value = false
  }
}

async function openQuote(quote: QuoteRecord) {
  selected.value = await getQuote(quote.quoteId)
}

function renderMap() {
  if (!mapElement.value || !selected.value) return

  const center = selected.value.address.coordinate ?? { lat: 55.6761, lon: 12.5683 }
  const polygon = selected.value.verified?.roofPolygon

  if (!map) {
    map = L.map(mapElement.value, {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
    }).setView([center.lat, center.lon], 19)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20,
    }).addTo(map)
  }

  map.setView([center.lat, center.lon], 19)
  if (polygonLayer) {
    polygonLayer.remove()
    polygonLayer = null
  }
  if (polygon) {
    polygonLayer = L.polygon(
      polygon.map((point) => [point.lat, point.lon]),
      { color: '#0f766e', weight: 3, fillColor: '#14b8a6', fillOpacity: 0.18 },
    ).addTo(map)
  }
  map.invalidateSize()
}

function startEditEstimate() {
  editingEstimate.value = true
}

function cancelEditEstimate() {
  editingEstimate.value = false
  // Reset form values
  if (selected.value) {
    editPriceMin.value = selected.value.estimate.price.min
    editPriceMax.value = selected.value.estimate.price.max
    editBuildingArea.value = selected.value.estimate.facts.buildingAreaM2
    editFloors.value = selected.value.estimate.facts.floors
    editGutterMeters.value = selected.value.estimate.facts.estimatedGutterMeters
    editConfidence.value = selected.value.estimate.confidence
  }
}

async function saveEditEstimate() {
  if (!selected.value) return

  try {
    const updateData = {
      price: {
        min: editPriceMin.value,
        max: editPriceMax.value,
        currency: 'DKK' as const
      },
      facts: {
        buildingAreaM2: editBuildingArea.value,
        floors: editFloors.value,
        estimatedGutterMeters: editGutterMeters.value,
        source: selected.value.estimate.facts.source,
        bbrBuildingId: selected.value.estimate.facts.bbrBuildingId,
        buildingNumber: selected.value.estimate.facts.buildingNumber,
        buildingUsage: selected.value.estimate.facts.buildingUsage
      },
      confidence: editConfidence.value
    }

    // Call the admin endpoint to update the estimate
    const response = await fetch(`${import.meta.env.VITE_GATEWAY_URL ?? 'http://localhost:4010'}/admin/quotes/${selected.value.quoteId}/estimate`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(updateData),
    })

    if (!response.ok) {
      throw new Error('Kunne ikke opdatere estimat')
    }

    // Refresh the quote data
    selected.value = await getQuote(selected.value.quoteId)
    editingEstimate.value = false
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Ukendt fejl.'
  }
}

function formatDkk(value: number) {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('da-DK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
</script>

<template>
  <main class="shell">
    <section class="topbar">
      <div>
        <p class="eyebrow">Mester-panel</p>
        <h1>TagrendeQuote</h1>
      </div>
      <button type="button" class="secondary" @click="refreshQuotes">Opdater</button>
    </section>

    <section v-if="error" class="notice">
      {{ error }} Gateway: {{ getGatewayUrl() }}
    </section>

    <section class="layout">
      <aside class="queue">
        <div class="queue-header">
          <h2>Tilbudskø</h2>
          <span>{{ quotes.length }} sager</span>
        </div>

        <p v-if="loading" class="muted">Henter tilbud...</p>
        <p v-else-if="quotes.length === 0" class="muted">Ingen tilbud endnu.</p>

        <button
          v-for="quote in quotes"
          :key="quote.quoteId"
          type="button"
          class="quote-row"
          :class="{ active: selected?.quoteId === quote.quoteId }"
          @click="openQuote(quote)"
        >
          <span class="row-main">
            <strong>{{ quote.address.label }}</strong>
            <small>{{ quote.customer.name || 'Ukendt kunde' }}</small>
          </span>
          <span class="row-side">
            <span class="status" :data-status="quote.status">{{ quote.status }}</span>
            <small>{{ formatDate(quote.updatedAt) }}</small>
          </span>
        </button>
      </aside>

      <section v-if="selected" class="detail">
        <div class="detail-header">
          <div>
            <p class="eyebrow">Tilbud {{ selected.quoteId.slice(0, 8) }}</p>
            <h2>{{ selected.address.label }}</h2>
          </div>
          <div class="price">{{ selectedPrice }}</div>
        </div>

        <div class="grid">
          <article class="panel">
            <h3>Kunde</h3>
            <dl>
              <div><dt>Navn</dt><dd>{{ selected.customer.name || '-' }}</dd></div>
              <div><dt>Telefon</dt><dd>{{ selected.customer.phone || '-' }}</dd></div>
              <div><dt>E-mail</dt><dd>{{ selected.customer.email || '-' }}</dd></div>
            </dl>
          </article>

         <article class="panel">
           <h3>BBR-estimat</h3>
           <div v-if="editingEstimate" class="estimate-editor">
             <div class="form-group">
               <label>Min pris (DKK)</label>
               <input type="number" v-model.number="editPriceMin" min="0" />
             </div>
             <div class="form-group">
               <label>Max pris (DKK)</label>
               <input type="number" v-model.number="editPriceMax" min="0" />
             </div>
             <div class="form-group">
               <label>Bebygget areal (m2)</label>
               <input type="number" v-model.number="editBuildingArea" min="0" />
             </div>
             <div class="form-group">
               <label>Etager</label>
               <input type="number" v-model.number="editFloors" min="0" />
             </div>
             <div class="form-group">
               <label>Tagrende (m)</label>
               <input type="number" v-model.number="editGutterMeters" min="0" />
             </div>
             <div class="form-group">
               <label>Confidence (0-1)</label>
               <input type="number" v-model.number="editConfidence" min="0" max="1" step="0.01" />
             </div>
             <div class="form-actions">
               <button type="button" class="secondary" @click="cancelEditEstimate">Annuller</button>
               <button type="button" @click="saveEditEstimate">Gem ændringer</button>
             </div>
           </div>
           <div v-else>
             <dl>
               <div><dt>Bebygget areal</dt><dd>{{ selected.estimate.facts.buildingAreaM2 }} m2</dd></div>
               <div><dt>Etager</dt><dd>{{ selected.estimate.facts.floors }}</dd></div>
               <div><dt>Tagrende</dt><dd>{{ selected.estimate.facts.estimatedGutterMeters }} m</dd></div>
               <div><dt>Kilde</dt><dd>{{ selected.estimate.facts.source }}</dd></div>
               <div><dt>Prisinterval</dt><dd>{{ formatDkk(selected.estimate.price.min) }}-{{ formatDkk(selected.estimate.price.max) }}</dd></div>
               <div><dt>Confidence</dt><dd>{{ Math.round(selected.estimate.confidence * 100) }}%</dd></div>
             </dl>
             <button type="button" @click="startEditEstimate" class="secondary">Rediger estimat</button>
           </div>
         </article>

          <article class="panel">
            <h3>Verificering</h3>
            <dl>
              <div><dt>Status</dt><dd>{{ selected.status }}</dd></div>
              <div><dt>Trærisiko</dt><dd>{{ selected.verified?.treeRisk || 'Afventer' }}</dd></div>
              <div><dt>AI-confidence</dt><dd>{{ Math.round((selected.verified?.confidence ?? selected.estimate.confidence) * 100) }}%</dd></div>
            </dl>
          </article>
        </div>

        <article class="map-panel">
          <div class="map-header">
            <div>
              <h3>Luftfoto og taglinje</h3>
              <p>AI-polygon kan senere gøres redigerbar direkte i kortet.</p>
            </div>
            <span class="status" :data-status="selected.status">{{ selected.status }}</span>
          </div>
          <div ref="mapElement" class="map"></div>
        </article>

        <article class="panel notes">
          <h3>Noter</h3>
          <ul>
            <li v-for="note in selected.verified?.notes ?? selected.estimate.riskFlags" :key="note">
              {{ note }}
            </li>
            <li v-if="!selected.verified && selected.estimate.riskFlags.length === 0">
              Afventer billedverificering.
            </li>
          </ul>
        </article>
      </section>
    </section>
  </main>
</template>
