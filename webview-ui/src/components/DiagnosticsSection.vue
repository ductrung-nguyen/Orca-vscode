<script setup lang="ts">
/**
 * DiagnosticsSection - Warnings/errors panel with collapsible toggle (F14)
 * Hidden when no diagnostics present
 */
import { ref, computed } from 'vue';
import Panel from 'primevue/panel';
import type { DiagnosticMessage } from '@/types/ParsedResults';

interface Props {
  warnings: DiagnosticMessage[];
  errors: DiagnosticMessage[];
}

const props = defineProps<Props>();

// Panel collapse state
const isCollapsed = ref(false);

// Check if we have any diagnostics
const hasDiagnostics = computed(() => props.warnings.length > 0 || props.errors.length > 0);
const totalCount = computed(() => props.warnings.length + props.errors.length);

// Panel header text
const headerText = computed(() => {
  const parts: string[] = [];
  if (props.errors.length > 0) {
    parts.push(`${props.errors.length} error${props.errors.length > 1 ? 's' : ''}`);
  }
  if (props.warnings.length > 0) {
    parts.push(`${props.warnings.length} warning${props.warnings.length > 1 ? 's' : ''}`);
  }
  return `Diagnostics (${parts.join(', ')})`;
});

// Severity for panel styling
const panelSeverity = computed(() => {
  if (props.errors.length > 0) return 'error';
  return 'warning';
});
</script>

<template>
  <section v-if="hasDiagnostics" class="diagnostics-section" aria-label="Diagnostics">
    <Panel
      :header="headerText"
      toggleable
      :collapsed="isCollapsed"
      @update:collapsed="isCollapsed = $event"
      :class="['diagnostics-panel', `severity-${panelSeverity}`]"
    >
      <template #header>
        <div class="panel-header">
          <i :class="panelSeverity === 'error' ? 'pi pi-times-circle' : 'pi pi-exclamation-triangle'" />
          <span class="header-text">{{ headerText }}</span>
        </div>
      </template>

      <!-- Errors Section -->
      <div v-if="errors.length > 0" class="diagnostic-group errors">
        <h4 class="group-title">
          <i class="pi pi-times-circle" />
          Errors
        </h4>
        <ul class="diagnostic-list">
          <li v-for="(error, index) in errors" :key="`error-${index}`" class="diagnostic-item error">
            <span class="message">{{ error.message }}</span>
            <span v-if="error.lineNumber" class="line-ref">Line {{ error.lineNumber }}</span>
          </li>
        </ul>
      </div>

      <!-- Warnings Section -->
      <div v-if="warnings.length > 0" class="diagnostic-group warnings">
        <h4 class="group-title">
          <i class="pi pi-exclamation-triangle" />
          Warnings
        </h4>
        <ul class="diagnostic-list">
          <li v-for="(warning, index) in warnings" :key="`warning-${index}`" class="diagnostic-item warning">
            <span class="message">{{ warning.message }}</span>
            <span v-if="warning.lineNumber" class="line-ref">Line {{ warning.lineNumber }}</span>
          </li>
        </ul>
      </div>
    </Panel>
  </section>
</template>

<style scoped>
.diagnostics-section {
  margin-bottom: 24px;
}

.diagnostics-panel {
  border-radius: 6px;
  overflow: hidden;
}

.diagnostics-panel.severity-error {
  border-color: var(--vscode-testing-iconFailed);
}

.diagnostics-panel.severity-warning {
  border-color: var(--vscode-editorWarning-foreground);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-header i {
  font-size: 1.1em;
}

.severity-error .panel-header i {
  color: var(--vscode-testing-iconFailed);
}

.severity-warning .panel-header i {
  color: var(--vscode-editorWarning-foreground);
}

.header-text {
  font-weight: 600;
}

.diagnostic-group {
  margin-bottom: 16px;
}

.diagnostic-group:last-child {
  margin-bottom: 0;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.95em;
  font-weight: 600;
  margin: 0 0 8px 0;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--vscode-panel-border);
}

.errors .group-title {
  color: var(--vscode-testing-iconFailed);
}

.warnings .group-title {
  color: var(--vscode-editorWarning-foreground);
}

.diagnostic-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.diagnostic-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 4px;
  font-size: 0.9em;
}

.diagnostic-item.error {
  background: color-mix(in srgb, var(--vscode-testing-iconFailed) 10%, transparent);
  border-left: 3px solid var(--vscode-testing-iconFailed);
}

.diagnostic-item.warning {
  background: color-mix(in srgb, var(--vscode-editorWarning-foreground) 10%, transparent);
  border-left: 3px solid var(--vscode-editorWarning-foreground);
}

.message {
  flex: 1;
  word-break: break-word;
}

.line-ref {
  flex-shrink: 0;
  font-size: 0.85em;
  color: var(--vscode-descriptionForeground);
  font-family: var(--vscode-editor-font-family);
}
</style>
