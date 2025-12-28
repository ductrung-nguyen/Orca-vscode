<script setup lang="ts">
import { inject, ref, computed } from 'vue';

// Inject initial data from extension
const initialData = inject<unknown>('initialData');

// Reactive state
const message = ref('Vue3 Dashboard');
const hasData = computed(() => initialData !== undefined && initialData !== null);
</script>

<template>
  <div id="orca-dashboard">
    <header class="dashboard-header">
      <h1>{{ message }}</h1>
      <span class="status-badge" :class="{ 'has-data': hasData }">
        {{ hasData ? 'Connected' : 'Waiting for data...' }}
      </span>
    </header>
    <main class="dashboard-main">
      <div v-if="hasData" class="data-preview">
        <p>✅ Data received from extension</p>
        <pre class="data-json">{{ JSON.stringify(initialData, null, 2).slice(0, 500) }}...</pre>
      </div>
      <div v-else class="loading-state">
        <p>⏳ Waiting for ORCA output data...</p>
        <p class="hint">Open an ORCA .out file to see the dashboard</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
#orca-dashboard {
  padding: 16px;
  color: var(--vscode-foreground);
  background: var(--vscode-editor-background);
  min-height: 100vh;
  font-family: var(--vscode-font-family);
}

.dashboard-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--vscode-panel-border);
}

.dashboard-header h1 {
  margin: 0;
  font-size: 1.5em;
  font-weight: 600;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75em;
  background: var(--vscode-editorWarning-foreground);
  color: var(--vscode-editor-background);
}

.status-badge.has-data {
  background: var(--vscode-testing-iconPassed);
}

.dashboard-main {
  padding: 16px;
}

.loading-state {
  text-align: center;
  padding: 48px;
}

.loading-state .hint {
  color: var(--vscode-descriptionForeground);
  font-size: 0.9em;
}

.data-preview {
  padding: 16px;
  background: var(--vscode-textBlockQuote-background);
  border-radius: 4px;
}

.data-json {
  margin-top: 12px;
  padding: 12px;
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
  overflow-x: auto;
  font-family: var(--vscode-editor-font-family);
  font-size: 0.85em;
}
</style>
