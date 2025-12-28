<script setup lang="ts">
/**
 * OptimizationSection - Geometry optimization cycles with dual convergence charts (F9, F10, F11)
 * Features sortable columns (N3) and resizable columns (N4)
 */
import { computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import LineChart from './shared/LineChart.vue';
import type { GeometryStep } from '@/types/ParsedResults';

interface Props {
  cycles: GeometryStep[];
  converged: boolean;
}

const props = defineProps<Props>();

// Check if we have data
const hasCycles = computed(() => props.cycles.length > 0);

// Format small numbers with scientific notation
const formatNumber = (value: number | undefined, precision: number = 6) => {
  if (value === undefined || value === null) return 'N/A';
  if (Math.abs(value) < 0.0001 || Math.abs(value) > 10000) {
    return value.toExponential(precision);
  }
  return value.toFixed(precision);
};

// Energy convergence chart
const energyLabels = computed(() => props.cycles.map((c) => c.stepNumber));
const energyDatasets = computed(() => [
  {
    label: 'Energy (Hartree)',
    data: props.cycles.map((c) => c.energy),
    borderColor: '#0e639c'
  }
]);

// Gradient convergence chart - dual series
const gradientDatasets = computed(() => [
  {
    label: 'RMS Gradient',
    data: props.cycles.map((c) => c.rmsGradient),
    borderColor: '#4ec9b0'
  },
  {
    label: 'Max Gradient',
    data: props.cycles.map((c) => c.maxGradient),
    borderColor: '#cca700'
  }
]);

// Step size chart
const stepDatasets = computed(() => [
  {
    label: 'RMS Step',
    data: props.cycles.map((c) => c.rmsStep),
    borderColor: '#9b59b6'
  },
  {
    label: 'Max Step',
    data: props.cycles.map((c) => c.maxStep),
    borderColor: '#f14c4c'
  }
]);

// Get row class for highlighting
const rowClass = (data: GeometryStep) => {
  if (data.converged) {
    return 'converged-row';
  }
  return '';
};
</script>

<template>
  <section class="optimization-section" aria-label="Geometry Optimization">
    <h2 class="section-title">
      <i class="pi pi-arrows-alt" />
      Geometry Optimization
      <span class="cycle-count">({{ cycles.length }} steps)</span>
      <Tag
        v-if="converged"
        severity="success"
        value="Converged"
        class="status-tag"
      />
      <Tag
        v-else-if="cycles.length > 0"
        severity="warning"
        value="Not Converged"
        class="status-tag"
      />
    </h2>

    <div v-if="hasCycles" class="optimization-content">
      <!-- Charts Row - Energy and Gradient -->
      <div class="charts-row">
        <div class="chart-container">
          <LineChart
            :labels="energyLabels"
            :datasets="energyDatasets"
            title="Energy Convergence"
            x-axis-label="Step"
            y-axis-label="Energy (Hartree)"
            :height="220"
          />
        </div>
        <div class="chart-container">
          <LineChart
            :labels="energyLabels"
            :datasets="gradientDatasets"
            title="Gradient Convergence"
            x-axis-label="Step"
            y-axis-label="Gradient (Hartree/Bohr)"
            :height="220"
            logarithmic
          />
        </div>
      </div>

      <!-- Charts Row - Step sizes -->
      <div class="charts-row single">
        <div class="chart-container">
          <LineChart
            :labels="energyLabels"
            :datasets="stepDatasets"
            title="Step Size"
            x-axis-label="Step"
            y-axis-label="Step (Bohr)"
            :height="200"
            logarithmic
          />
        </div>
      </div>

      <!-- Data Table -->
      <DataTable
        :value="cycles"
        :row-class="rowClass"
        striped-rows
        responsive-layout="scroll"
        class="optimization-table"
        sortable
        resizable-columns
        column-resize-mode="fit"
      >
        <Column field="stepNumber" header="Step" sortable style="width: 60px" />
        <Column field="energy" header="Energy (Hartree)" sortable style="min-width: 150px">
          <template #body="{ data }">
            <code class="mono-value">{{ formatNumber(data.energy, 10) }}</code>
          </template>
        </Column>
        <Column field="deltaEnergy" header="ΔE" sortable style="min-width: 100px">
          <template #body="{ data }">
            <code class="mono-value">{{ formatNumber(data.deltaEnergy) }}</code>
          </template>
        </Column>
        <Column field="rmsGradient" header="RMS Grad" sortable style="min-width: 100px">
          <template #body="{ data }">
            <code class="mono-value">{{ formatNumber(data.rmsGradient) }}</code>
          </template>
        </Column>
        <Column field="maxGradient" header="Max Grad" sortable style="min-width: 100px">
          <template #body="{ data }">
            <code class="mono-value">{{ formatNumber(data.maxGradient) }}</code>
          </template>
        </Column>
        <Column field="rmsStep" header="RMS Step" sortable style="min-width: 100px">
          <template #body="{ data }">
            <code class="mono-value">{{ formatNumber(data.rmsStep) }}</code>
          </template>
        </Column>
        <Column field="maxStep" header="Max Step" sortable style="min-width: 100px">
          <template #body="{ data }">
            <code class="mono-value">{{ formatNumber(data.maxStep) }}</code>
          </template>
        </Column>
        <Column header="Status" style="width: 100px">
          <template #body="{ data }">
            <Tag
              v-if="data.converged"
              severity="success"
              value="✓"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <div v-else class="no-data">
      <i class="pi pi-info-circle" />
      <span>No geometry optimization data available</span>
    </div>
  </section>
</template>

<style scoped>
.optimization-section {
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
  flex-wrap: wrap;
}

.section-title i {
  color: var(--vscode-descriptionForeground);
}

.cycle-count {
  font-weight: 400;
  font-size: 0.85em;
  color: var(--vscode-descriptionForeground);
}

.status-tag {
  margin-left: 8px;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.charts-row.single {
  grid-template-columns: 1fr;
  max-width: 50%;
}

@media (max-width: 800px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
  .charts-row.single {
    max-width: 100%;
  }
}

.chart-container {
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 6px;
  padding: 12px;
}

.optimization-table {
  font-size: 0.85em;
}

.mono-value {
  font-family: var(--vscode-editor-font-family);
  font-size: 0.9em;
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
