<script setup lang="ts">
/**
 * TimingSection - Timing breakdown with total time and section percentages
 */
import { computed } from 'vue';
import ProgressBar from 'primevue/progressbar';
import type { TimingInfo } from '@/types/ParsedResults';

interface Props {
  timing?: TimingInfo | null;
  totalRunTime?: number | null;
}

const props = defineProps<Props>();

// Check if we have timing data
const hasTiming = computed(() => {
  return props.timing || props.totalRunTime !== null;
});

// Format time from seconds
const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) {
    return `${mins}m ${secs.toFixed(0)}s`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m ${secs.toFixed(0)}s`;
};

// Total time display
const totalTimeDisplay = computed(() => {
  if (props.timing?.totalTime) {
    return props.timing.totalTime;
  }
  if (props.totalRunTime !== null && props.totalRunTime !== undefined) {
    return formatTime(props.totalRunTime);
  }
  return 'N/A';
});

// Progress bar color based on percentage
const getProgressColor = (percentage: number): string => {
  if (percentage > 50) return 'var(--vscode-testing-iconFailed)';
  if (percentage > 25) return 'var(--vscode-editorWarning-foreground)';
  return 'var(--vscode-testing-iconPassed)';
};
</script>

<template>
  <section v-if="hasTiming" class="timing-section" aria-label="Timing Information">
    <h2 class="section-title">
      <i class="pi pi-clock" />
      Timing
    </h2>

    <div class="timing-content">
      <!-- Total Time Card -->
      <div class="total-time-card">
        <span class="total-label">Total Run Time</span>
        <span class="total-value">{{ totalTimeDisplay }}</span>
      </div>

      <!-- Section Breakdown -->
      <div v-if="timing?.sections && timing.sections.length > 0" class="sections-breakdown">
        <h4 class="breakdown-title">Time by Section</h4>
        <div class="section-list">
          <div 
            v-for="section in timing.sections" 
            :key="section.name"
            class="section-row"
          >
            <div class="section-info">
              <span class="section-name">{{ section.name }}</span>
              <span class="section-time">{{ section.time }}</span>
            </div>
            <div class="section-bar">
              <ProgressBar 
                :value="section.percentage" 
                :show-value="false"
                :style="{ '--p-progressbar-value-background': getProgressColor(section.percentage) }"
              />
              <span class="section-percentage">{{ section.percentage.toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Simple display when only total time is available -->
      <div v-else-if="totalRunTime !== null && totalRunTime !== undefined" class="simple-timing">
        <p class="timing-note">
          <i class="pi pi-info-circle" />
          Detailed timing breakdown not available
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.timing-section {
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

.total-time-card {
  display: flex;
  flex-direction: column;
  padding: 16px 20px;
  background: var(--vscode-textBlockQuote-background);
  border-radius: 6px;
  margin-bottom: 16px;
  text-align: center;
  max-width: 200px;
}

.total-label {
  font-size: 0.8em;
  color: var(--vscode-descriptionForeground);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.total-value {
  font-size: 1.8em;
  font-weight: 700;
  font-family: var(--vscode-editor-font-family);
}

.breakdown-title {
  font-size: 0.95em;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: var(--vscode-foreground);
}

.section-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-name {
  font-size: 0.9em;
  font-weight: 500;
}

.section-time {
  font-size: 0.85em;
  color: var(--vscode-descriptionForeground);
  font-family: var(--vscode-editor-font-family);
}

.section-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-bar :deep(.p-progressbar) {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: var(--vscode-panel-border);
}

.section-percentage {
  font-size: 0.8em;
  font-family: var(--vscode-editor-font-family);
  color: var(--vscode-descriptionForeground);
  min-width: 45px;
  text-align: right;
}

.simple-timing {
  padding: 12px;
}

.timing-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--vscode-descriptionForeground);
  font-size: 0.9em;
}
</style>
