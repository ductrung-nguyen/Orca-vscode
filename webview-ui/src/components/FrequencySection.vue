<script setup lang="ts">
/**
 * FrequencySection - Vibrational frequencies with imaginary mode highlighting (F12, F13)
 * Features sortable columns (N3) and resizable columns (N4)
 */
import { computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import type { FrequencyData } from '@/types/ParsedResults';

interface Props {
  frequencies: FrequencyData[];
  imaginaryCount: number;
}

const props = defineProps<Props>();

// Check if we have data
const hasFrequencies = computed(() => props.frequencies.length > 0);

// Summary statistics
const realFreqCount = computed(() => props.frequencies.filter((f) => !f.isImaginary).length);
const highestFreq = computed(() => {
  if (!hasFrequencies.value) return null;
  return Math.max(...props.frequencies.map((f) => f.frequency));
});
const lowestFreq = computed(() => {
  if (!hasFrequencies.value) return null;
  return Math.min(...props.frequencies.map((f) => f.frequency));
});

// Format frequency with sign for imaginary
const formatFrequency = (freq: number, isImaginary: boolean) => {
  const value = Math.abs(freq).toFixed(2);
  return isImaginary ? `-${value}i` : value;
};

// Get row class for highlighting imaginary frequencies
const rowClass = (data: FrequencyData) => {
  if (data.isImaginary) {
    return 'imaginary-row';
  }
  return '';
};
</script>

<template>
  <section class="frequency-section" aria-label="Vibrational Frequencies">
    <h2 class="section-title">
      <i class="pi pi-wave-pulse" />
      Vibrational Frequencies
      <span class="freq-count">({{ frequencies.length }} modes)</span>
    </h2>

    <!-- Warning banner for imaginary frequencies -->
    <div v-if="imaginaryCount > 0" class="imaginary-warning">
      <i class="pi pi-exclamation-triangle" />
      <span>
        <strong>{{ imaginaryCount }} imaginary {{ imaginaryCount === 1 ? 'frequency' : 'frequencies' }}</strong>
        detected. This may indicate a transition state or saddle point.
      </span>
    </div>

    <div v-if="hasFrequencies" class="frequency-content">
      <!-- Summary Cards -->
      <div class="freq-summary">
        <div class="summary-card">
          <span class="summary-label">Total Modes</span>
          <span class="summary-value">{{ frequencies.length }}</span>
        </div>
        <div class="summary-card" :class="{ warning: imaginaryCount > 0 }">
          <span class="summary-label">Imaginary</span>
          <span class="summary-value">{{ imaginaryCount }}</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Real</span>
          <span class="summary-value">{{ realFreqCount }}</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Lowest</span>
          <span class="summary-value">{{ lowestFreq?.toFixed(1) }} cm⁻¹</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Highest</span>
          <span class="summary-value">{{ highestFreq?.toFixed(1) }} cm⁻¹</span>
        </div>
      </div>

      <!-- Data Table -->
      <DataTable
        :value="frequencies"
        :row-class="rowClass"
        striped-rows
        responsive-layout="scroll"
        class="frequency-table"
        sortable
        resizable-columns
        column-resize-mode="fit"
        :paginator="frequencies.length > 50"
        :rows="50"
        paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
      >
        <Column field="modeNumber" header="Mode" sortable style="width: 80px" />
        <Column field="frequency" header="Frequency (cm⁻¹)" sortable style="min-width: 150px">
          <template #body="{ data }">
            <code class="mono-value" :class="{ imaginary: data.isImaginary }">
              {{ formatFrequency(data.frequency, data.isImaginary) }}
            </code>
            <Tag
              v-if="data.isImaginary"
              severity="warning"
              value="Imaginary"
              class="imaginary-tag"
            />
          </template>
        </Column>
        <Column field="intensity" header="IR Intensity (km/mol)" sortable style="min-width: 150px">
          <template #body="{ data }">
            <code class="mono-value">{{ data.intensity.toFixed(4) }}</code>
          </template>
        </Column>
        <Column header="Type" style="width: 100px">
          <template #body="{ data }">
            <span :class="data.isImaginary ? 'type-imaginary' : 'type-real'">
              {{ data.isImaginary ? 'Imaginary' : 'Real' }}
            </span>
          </template>
        </Column>
      </DataTable>
    </div>

    <div v-else class="no-data">
      <i class="pi pi-info-circle" />
      <span>No frequency data available</span>
    </div>
  </section>
</template>

<style scoped>
.frequency-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1em;
  font-weight: 600;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--vscode-panel-border);
  color: var(--vscode-foreground);
}

.section-title i {
  color: var(--vscode-descriptionForeground);
}

.freq-count {
  font-weight: 400;
  font-size: 0.85em;
  color: var(--vscode-descriptionForeground);
}

.imaginary-warning {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: color-mix(in srgb, var(--vscode-editorWarning-foreground) 15%, transparent);
  border: 1px solid var(--vscode-editorWarning-foreground);
  border-radius: 6px;
  color: var(--vscode-foreground);
}

.imaginary-warning i {
  color: var(--vscode-editorWarning-foreground);
  font-size: 1.2em;
}

.freq-summary {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.summary-card {
  display: flex;
  flex-direction: column;
  padding: 10px 16px;
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 6px;
  min-width: 100px;
}

.summary-card.warning {
  border-color: var(--vscode-editorWarning-foreground);
}

.summary-label {
  font-size: 0.75em;
  color: var(--vscode-descriptionForeground);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-value {
  font-size: 1.2em;
  font-weight: 600;
  font-family: var(--vscode-editor-font-family);
}

.frequency-table {
  font-size: 0.9em;
}

.mono-value {
  font-family: var(--vscode-editor-font-family);
  font-size: 0.9em;
}

.mono-value.imaginary {
  color: var(--vscode-editorWarning-foreground);
  font-weight: 600;
}

.imaginary-tag {
  margin-left: 8px;
  font-size: 0.75em;
}

.type-imaginary {
  color: var(--vscode-editorWarning-foreground);
  font-weight: 500;
}

.type-real {
  color: var(--vscode-descriptionForeground);
}

.no-data {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 24px;
  background: var(--vscode-textBlockQuote-background);
  border-radius: 6px;
  color: var(--vscode-descriptionForeground);
  font-style: italic;
}

:deep(.imaginary-row) {
  background: color-mix(in srgb, var(--vscode-editorWarning-foreground) 10%, transparent) !important;
}
</style>
