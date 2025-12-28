<script setup lang="ts">
/**
 * App.vue - Root component composing all dashboard sections
 * Implements layout matching current dashboard (US-1, G3)
 * Features scroll persistence (F4) and action buttons (F15, F16, F17)
 */
import { ref, computed, onBeforeUnmount, onMounted, provide } from 'vue';
import Button from 'primevue/button';
import type { ParsedResults, ExtensionMessage } from '@/types/ParsedResults';
import { useVSCodeApi } from '@/composables/useVSCodeApi';
import { useWebviewState } from '@/composables/useWebviewState';

// Section Components
import TocSidebar from './components/TocSidebar.vue';
import SummarySection from './components/SummarySection.vue';
import EnergySection from './components/EnergySection.vue';
import ScfSection from './components/ScfSection.vue';
import OptimizationSection from './components/OptimizationSection.vue';
import FrequencySection from './components/FrequencySection.vue';
import TimingSection from './components/TimingSection.vue';

// VS Code API
const { refresh, copyToClipboard, openOutputFile } = useVSCodeApi();

// Initial data injection from extension
declare global {
  interface Window {
    initialData?: ParsedResults;
  }
}

// Reactive state
const data = ref<ParsedResults | null>(window.initialData || null);
const isLoading = ref(!window.initialData);
const mainContentRef = ref<HTMLElement | null>(null);
const isTocVisible = ref(window.innerWidth > 768);

// Scroll position persistence (F4)
const scrollTop = useWebviewState<number>('scrollTop', 0);

// Provide data to child components
provide('parsedResults', data);

// Check if sections should be shown - ensure data is not null AND has actual content
const hasData = computed(() => {
  const result = data.value !== null && data.value !== undefined && typeof data.value === 'object';
  return result;
});
const hasScfData = computed(() => {
  const result = (data.value?.scfIterations?.length ?? 0) > 0;
  return result;
});
const hasOptData = computed(() => {
  const result = (data.value?.geometrySteps?.length ?? 0) > 0;
  return result;
});
const hasFreqData = computed(() => {
  const result = data.value?.hasFrequencies && (data.value?.frequencies?.length ?? 0) > 0;
  return result;
});
const hasTiming = computed(() => {
  const result = !!(data.value?.timing) || (data.value?.totalRunTime !== null && data.value?.totalRunTime !== undefined);
  return result;
});
const hasToc = computed(() => {
  const result = (data.value?.tocEntries?.length ?? 0) > 0;
  return result;
});

// Scroll position restore + message listener
onMounted(() => {
  if (mainContentRef.value && scrollTop.value > 0) {
    mainContentRef.value.scrollTop = scrollTop.value;
  }
  window.addEventListener('message', handleMessage);
});

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage);
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
    scrollTimeout = null;
  }
});

// Debounced scroll save
let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
const handleScroll = () => {
  if (scrollTimeout) clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    if (mainContentRef.value) {
      scrollTop.value = mainContentRef.value.scrollTop;
    }
  }, 100);
};

const handleMessage = (event: MessageEvent<ExtensionMessage>) => {
  const message = event.data;
  switch (message.type) {
    case 'updateData':
      data.value = message.data;
      isLoading.value = false;
      break;
    case 'refresh':
      isLoading.value = true;
      break;
    case 'themeChanged':
      // Force re-render of charts on theme change
      break;
  }
};

// Action handlers
const handleRefresh = () => {
  isLoading.value = true;
  refresh();
};

const handleCopyJson = () => {
  if (data.value) {
    copyToClipboard(JSON.stringify(data.value, null, 2));
  }
};

const handleOpenFile = () => {
  openOutputFile();
};

const toggleToc = () => {
  isTocVisible.value = !isTocVisible.value;
};
</script>

<template>
  <div id="orca-dashboard" :class="{ 'has-toc': hasToc && isTocVisible }">
    <!-- TOC Toggle Button - Always visible when TOC data exists -->
    <Button
      v-if="hasToc"
      :icon="isTocVisible ? 'pi pi-times' : 'pi pi-bars'"
      text
      rounded
      size="small"
      @click="toggleToc"
      :aria-label="isTocVisible ? 'Hide Table of Contents' : 'Show Table of Contents'"
      class="toc-toggle-btn-floating"
    />

    <!-- TOC Sidebar -->
    <TocSidebar
      v-if="hasToc && data && isTocVisible"
      :entries="data.tocEntries"
      title="Contents"
    />

    <!-- Main Content -->
    <main 
      ref="mainContentRef" 
      class="dashboard-main"
      @scroll="handleScroll"
    >
      <!-- Header -->
      <header class="dashboard-header">
        <div class="header-info">
          <h1 class="dashboard-title">
            <i class="pi pi-chart-bar" />
            {{ data?.fileName || 'ORCA Dashboard' }}
          </h1>
          <span v-if="data?.jobStatus" class="job-status" :class="data.jobStatus">
            {{ data.jobStatus }}
          </span>
        </div>
        <div class="header-actions">
          <Button
            icon="pi pi-refresh"
            label="Refresh"
            severity="secondary"
            text
            size="small"
            @click="handleRefresh"
            :loading="isLoading"
          />
          <Button
            icon="pi pi-copy"
            label="Copy JSON"
            severity="secondary"
            text
            size="small"
            @click="handleCopyJson"
            :disabled="!hasData"
          />
          <Button
            icon="pi pi-external-link"
            label="Open File"
            severity="secondary"
            text
            size="small"
            @click="handleOpenFile"
          />
        </div>
      </header>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <i class="pi pi-spin pi-spinner" />
        <span>Loading ORCA results...</span>
      </div>

      <!-- No Data State -->
      <div v-if="!isLoading && !hasData" class="empty-state">
        <i class="pi pi-inbox" />
        <h2>No Data Available</h2>
        <p>Open an ORCA output file (.out) to view the dashboard</p>
      </div>

      <!-- Dashboard Content -->
        <div v-if="!isLoading && hasData" class="dashboard-content">
        <!-- Summary Section -->
        <SummarySection v-if="data" :data="data" />

        <!-- Energy Section -->
        <EnergySection
          v-if="data"
          :energy="data.finalEnergy"
          :zero-point-energy="data.zeroPointEnergy"
          :converged="data.converged"
        />

        <!-- SCF Section -->
        <ScfSection
          v-if="hasScfData && data"
          :iterations="data.scfIterations"
        />

        <!-- Optimization Section -->
        <OptimizationSection
          v-if="hasOptData && data"
          :cycles="data.geometrySteps"
          :converged="data.optimizationConverged"
        />

        <!-- Frequency Section -->
        <FrequencySection
          v-if="hasFreqData && data"
          :frequencies="data.frequencies"
          :imaginary-count="data.imaginaryFreqCount"
        />

        <!-- Timing Section -->
        <TimingSection
          v-if="hasTiming && data"
          :timing="data.timing"
          :total-run-time="data.totalRunTime"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
#orca-dashboard {
  display: flex;
  height: 100vh;
  width: 100%;
  color: var(--vscode-foreground);
  background: var(--vscode-editor-background);
  font-family: var(--vscode-font-family);
}

.dashboard-main {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
}

.dashboard-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: var(--vscode-editor-background);
  border-bottom: 1px solid var(--vscode-panel-border);
  flex-wrap: wrap;
  gap: 12px;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toc-toggle-btn-floating {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 100;
  color: var(--vscode-foreground) !important;
  background: var(--vscode-editor-background) !important;
  border: 1px solid var(--vscode-panel-border) !important;
  padding: 0.5rem !important;
  width: 2rem !important;
  height: 2rem !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.toc-toggle-btn-floating:hover {
  background: var(--vscode-list-hoverBackground) !important;
}

/* When TOC is visible, position the button relative to it */
#orca-dashboard.has-toc .toc-toggle-btn-floating {
  left: 272px; /* 260px TOC width + 12px margin */
}

.dashboard-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 1.2em;
  font-weight: 600;
}

.dashboard-title i {
  color: var(--vscode-descriptionForeground);
}

.job-status {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75em;
  font-weight: 500;
  text-transform: uppercase;
}

.job-status.finished {
  background: var(--vscode-testing-iconPassed);
  color: var(--vscode-editor-background);
}

.job-status.running {
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
}

.job-status.died,
.job-status.killed {
  background: var(--vscode-testing-iconFailed);
  color: var(--vscode-editor-background);
}

.header-actions {
  display: flex;
  gap: 4px;
}

.dashboard-content {
  padding: 20px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--vscode-descriptionForeground);
}

.loading-state i,
.empty-state i {
  font-size: 3em;
  margin-bottom: 16px;
  opacity: 0.5;
}

.loading-state span {
  font-size: 1.1em;
}

.empty-state h2 {
  margin: 0 0 8px 0;
  font-weight: 600;
  color: var(--vscode-foreground);
}

.empty-state p {
  margin: 0;
  font-size: 0.95em;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  #orca-dashboard.has-toc {
    flex-direction: column;
  }

  #orca-dashboard.has-toc .toc-toggle-btn-floating {
    left: 12px; /* Reset position on mobile */
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    padding-left: 50px; /* Make room for floating button */
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .dashboard-content {
    padding: 16px;
  }
}

/* Ensure main content never disappears */
.dashboard-main {
  min-width: 0;
  flex: 1;
}
</style>
