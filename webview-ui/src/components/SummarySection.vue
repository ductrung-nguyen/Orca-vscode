<script setup lang="ts">
/**
 * SummarySection - Displays overview metrics for the ORCA calculation
 * Shows calculation type, method, basis set, and convergence status (F5)
 */
import MetricCard from './shared/MetricCard.vue';
import type { ParsedResults } from '@/types/ParsedResults';

interface Props {
  data: ParsedResults;
}

const props = defineProps<Props>();

// Derive overall status from convergence flags
// Note: We use 'converged' which is derived from actual ORCA output markers (e.g., "HURRAY")
// The 'hasErrors' field was previously based on algorithm metrics (DIIS errors etc.) which are not real errors
const overallStatus = () => {
  // Check for actual SCF failure (not converged markers)
  if (props.data.scfFailed) {
    return { label: 'SCF Failed', status: 'error' as const };
  }
  // Check for imaginary frequencies in frequency calculations
  if (props.data.hasFrequencies && props.data.imaginaryFreqCount > 0) {
    return { label: 'Imaginary Frequencies', status: 'warning' as const };
  }
  // Check if converged (based on "HURRAY" or similar markers)
  if (props.data.converged) {
    return { label: 'Converged', status: 'success' as const };
  }
  // Job finished but not explicitly marked as converged
  if (props.data.jobStatus === 'finished') {
    return { label: 'Completed', status: 'success' as const };
  }
  // Still running or unknown state
  return { label: 'In Progress', status: 'info' as const };
};

// Job status display
const jobStatusDisplay = () => {
  const statusMap: Record<string, { label: string; status: 'success' | 'warning' | 'error' | 'info' }> = {
    finished: { label: 'Finished', status: 'success' },
    running: { label: 'Running', status: 'info' },
    died: { label: 'Error', status: 'error' },
    killed: { label: 'Killed', status: 'warning' },
    unknown: { label: 'Unknown', status: 'info' }
  };
  return statusMap[props.data.jobStatus] || statusMap.unknown;
};
</script>

<template>
  <section class="summary-section" aria-label="Calculation Summary">
    <h2 class="section-title">
      <i class="pi pi-info-circle" />
      Summary
    </h2>
    <div class="metrics-grid">
      <MetricCard
        label="Calculation Type"
        :value="data.calculationType"
        icon="pi pi-calculator"
        placeholder="Not specified"
      />
      <MetricCard
        label="Method"
        :value="data.method"
        icon="pi pi-cog"
        placeholder="Not specified"
      />
      <MetricCard
        label="Basis Set"
        :value="data.basis"
        icon="pi pi-sitemap"
        placeholder="Not specified"
      />
      <MetricCard
        label="Job Status"
        :value="jobStatusDisplay().label"
        :status="jobStatusDisplay().status"
        icon="pi pi-flag"
      />
      <MetricCard
        label="Convergence"
        :value="overallStatus().label"
        :status="overallStatus().status"
        icon="pi pi-check-circle"
      />
      <MetricCard
        v-if="data.charge !== undefined || data.multiplicity !== undefined"
        label="Charge / Multiplicity"
        :value="`${data.charge ?? '?'} / ${data.multiplicity ?? '?'}`"
        icon="pi pi-bolt"
      />
    </div>
  </section>
</template>

<style scoped>
.summary-section {
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

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

@media (max-width: 600px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
