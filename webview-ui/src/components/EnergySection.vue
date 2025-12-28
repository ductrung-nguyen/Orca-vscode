<script setup lang="ts">
/**
 * EnergySection - Displays final energy with unit conversions (F6)
 * Shows energy in Hartree, eV, and kcal/mol
 */
import MetricCard from './shared/MetricCard.vue';

interface Props {
  /** Final energy in Hartree (null if not available) */
  energy: number | null;
  /** Zero-point energy in Hartree (optional) */
  zeroPointEnergy?: number | null;
  /** Whether SCF/optimization converged */
  converged: boolean;
}

const props = defineProps<Props>();

// Conversion factors
const HARTREE_TO_EV = 27.211386245988;
const HARTREE_TO_KCAL = 627.5094740631;

// Energy conversions
const energyInEv = () => {
  if (props.energy === null) return null;
  return props.energy * HARTREE_TO_EV;
};

const energyInKcal = () => {
  if (props.energy === null) return null;
  return props.energy * HARTREE_TO_KCAL;
};

const zpeInKcal = () => {
  if (props.zeroPointEnergy === null || props.zeroPointEnergy === undefined) return null;
  return props.zeroPointEnergy * HARTREE_TO_KCAL;
};

// Corrected energy (with ZPE)
const correctedEnergy = () => {
  if (props.energy === null || props.zeroPointEnergy === null || props.zeroPointEnergy === undefined) {
    return null;
  }
  return props.energy + props.zeroPointEnergy;
};
</script>

<template>
  <section class="energy-section" aria-label="Energy Results">
    <h2 class="section-title">
      <i class="pi pi-bolt" />
      Final Energy
    </h2>
    
    <div v-if="energy !== null" class="energy-display">
      <!-- Primary energy display -->
      <div class="primary-energy">
        <span class="energy-value">{{ energy.toFixed(10) }}</span>
        <span class="energy-unit">Hartree</span>
        <span 
          class="convergence-badge"
          :class="{ converged: converged, 'not-converged': !converged }"
        >
          {{ converged ? '✓ Converged' : '⚠ Not Converged' }}
        </span>
      </div>

      <!-- Energy unit conversions -->
      <div class="conversions-grid">
        <MetricCard
          label="Energy (eV)"
          :value="energyInEv()"
          unit="eV"
          mono
        />
        <MetricCard
          label="Energy (kcal/mol)"
          :value="energyInKcal()"
          unit="kcal/mol"
          mono
        />
        <MetricCard
          v-if="zeroPointEnergy !== null && zeroPointEnergy !== undefined"
          label="Zero-Point Energy"
          :value="zeroPointEnergy"
          unit="Hartree"
          mono
        />
        <MetricCard
          v-if="zpeInKcal() !== null"
          label="ZPE (kcal/mol)"
          :value="zpeInKcal()"
          unit="kcal/mol"
          mono
        />
        <MetricCard
          v-if="correctedEnergy() !== null"
          label="ZPE-Corrected Energy"
          :value="correctedEnergy()"
          unit="Hartree"
          mono
        />
      </div>
    </div>

    <div v-else class="no-energy">
      <i class="pi pi-exclamation-circle" />
      <span>Energy not available</span>
    </div>
  </section>
</template>

<style scoped>
.energy-section {
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

.primary-energy {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background: var(--vscode-textBlockQuote-background);
  border-radius: 6px;
  flex-wrap: wrap;
}

.energy-value {
  font-size: 1.8em;
  font-weight: 700;
  font-family: var(--vscode-editor-font-family);
  color: var(--vscode-foreground);
}

.energy-unit {
  font-size: 1em;
  color: var(--vscode-descriptionForeground);
}

.convergence-badge {
  margin-left: auto;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.85em;
  font-weight: 500;
}

.convergence-badge.converged {
  background: var(--vscode-testing-iconPassed);
  color: var(--vscode-editor-background);
}

.convergence-badge.not-converged {
  background: var(--vscode-editorWarning-foreground);
  color: var(--vscode-editor-background);
}

.conversions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.no-energy {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 24px;
  background: var(--vscode-textBlockQuote-background);
  border-radius: 6px;
  color: var(--vscode-descriptionForeground);
  font-style: italic;
}

.no-energy i {
  font-size: 1.2em;
}
</style>
