<script setup lang="ts">
/**
 * ScfSection - SCF iterations table with energy convergence chart (F7, F8)
 * Features sortable columns (N3) and resizable columns (N4)
 */
import { computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import LineChart from './shared/LineChart.vue';
import type { ScfIteration } from '@/types/ParsedResults';

interface Props {
  iterations: ScfIteration[];
}

const props = defineProps<Props>();

// Check if we have data
const hasIterations = computed(() => props.iterations.length > 0);

// Format small numbers with scientific notation
const formatNumber = (value: number, precision: number = 6) => {
  if (Math.abs(value) < 0.0001 || Math.abs(value) > 10000) {
    return value.toExponential(precision);
  }
  return value.toFixed(precision);
};

// Chart data for energy convergence
const chartLabels = computed(() => props.iterations.map((it) => it.iteration));
const chartDatasets = computed(() => [
  {
    label: 'Energy (Hartree)',
    data: props.iterations.map((it) => it.energy),
    borderColor: '#0e639c'
  }
]);

// Delta E chart for convergence visualization
const deltaEDatasets = computed(() => [
  {
    label: 'ΔE',
    data: props.iterations.map((it) => Math.abs(it.deltaE)),
    borderColor: '#4ec9b0'
  }
]);

// Get row class for highlighting converged iteration
const rowClass = (data: ScfIteration) => {
  const isLast = data.iteration === props.iterations.length;
  if (isLast && Math.abs(data.deltaE) < 1e-8) {
    return 'converged-row';
  }
  return '';
};
</script>

<template>
  <section class="scf-section" aria-label="SCF Iterations">
    <h2 class="section-title">
      <i class="pi pi-sync" />
      SCF Iterations
      <span class="iteration-count">({{ iterations.length }} cycles)</span>
    </h2>

    <div v-if="hasIterations" class="scf-content">
      <!-- Charts Row -->
      <div class="charts-row">
        <div class="chart-container">
          <LineChart
            :labels="chartLabels"
            :datasets="chartDatasets"
            title="SCF Energy Convergence"
            x-axis-label="Iteration"
            y-axis-label="Energy (Hartree)"
            :height="220"
          />
        </div>
        <div class="chart-container">
          <LineChart
            :labels="chartLabels"
            :datasets="deltaEDatasets"
            title="Energy Change (|ΔE|)"
            x-axis-label="Iteration"
            y-axis-label="|ΔE| (Hartree)"
            :height="220"
            logarithmic
          />
        </div>
      </div>

      <!-- Data Table -->
      <DataTable
        :value="iterations"
        :row-class="rowClass"
        striped-rows
        responsive-layout="scroll"
        class="scf-table"
        sortable
        resizable-columns
        column-resize-mode="fit"
      >
        <Column field="iteration" header="Iter" sortable style="width: 60px" />
        <Column field="energy" header="Energy (Hartree)" sortable style="min-width: 160px">
          <template #body="{ data }">
            <code class="mono-value">{{ formatNumber(data.energy, 10) }}</code>
          </template>
        </Column>
        <Column field="deltaE" header="ΔE" sortable style="min-width: 120px">
          <template #body="{ data }">
            <code class="mono-value" :class="{ 'small-value': Math.abs(data.deltaE) < 1e-6 }">
              {{ formatNumber(data.deltaE) }}
            </code>
          </template>
        </Column>
        <Column field="rmsDensityChange" header="RMS DP" sortable style="min-width: 100px">
          <template #body="{ data }">
            <code class="mono-value">{{ formatNumber(data.rmsDensityChange) }}</code>
          </template>
        </Column>
        <Column field="maxDensityChange" header="Max DP" sortable style="min-width: 100px">
          <template #body="{ data }">
            <code class="mono-value">{{ formatNumber(data.maxDensityChange) }}</code>
          </template>
        </Column>
      </DataTable>
    </div>

    <div v-else class="no-data">
      <i class="pi pi-info-circle" />
      <span>No SCF iteration data available</span>
    </div>
  </section>
</template>

<style scoped>
.scf-section {
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

.iteration-count {
  font-weight: 400;
  font-size: 0.85em;
  color: var(--vscode-descriptionForeground);
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

@media (max-width: 800px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
}

.chart-container {
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 6px;
  padding: 12px;
}

.scf-table {
  font-size: 0.9em;
}

.mono-value {
  font-family: var(--vscode-editor-font-family);
  font-size: 0.9em;
}

.small-value {
  color: var(--vscode-testing-iconPassed);
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

:deep(.converged-row) {
  background: color-mix(in srgb, var(--vscode-testing-iconPassed) 15%, transparent) !important;
}
</style>
