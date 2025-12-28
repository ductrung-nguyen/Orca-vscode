<script setup lang="ts">
/**
 * DiagnosticsSection - Warnings/errors panel with collapsible toggle (F14)
 * Hidden when no diagnostics present
 */
import { ref, computed } from 'vue';
import Panel from 'primevue/panel';
import type { DiagnosticMessage } from '@/types/ParsedResults';
import { useVSCodeApi } from '@/composables/useVSCodeApi';

interface Props {
  warnings: DiagnosticMessage[];
}

const props = defineProps<Props>();

// VS Code API for navigation
const { goToLine } = useVSCodeApi();

// Panel collapse state
const isCollapsed = ref(false);

// Navigate to line in output file
const navigateToLine = (lineNumber?: number) => {
  if (lineNumber) {
    goToLine(lineNumber);
  }
};

// Check if we have any diagnostics
const hasDiagnostics = computed(() => props.warnings.length > 0);
const totalCount = computed(() => props.warnings.length);

// Panel header text
const headerText = computed(() => {
  return `Warnings (${props.warnings.length})`;
});
</script>

<template>
  <section v-if="hasDiagnostics" class="diagnostics-section" aria-label="Warnings">
    <Panel
      :header="headerText"
      toggleable
      :collapsed="isCollapsed"
      @update:collapsed="isCollapsed = $event"
      class="diagnostics-panel"
    >
      <template #header>
        <div class="panel-header">
          <i class="pi pi-exclamation-triangle" />
          <span class="header-text">{{ headerText }}</span>
        </div>
      </template>

      <!-- Warnings Section -->
      <div v-if="warnings.length > 0" class="diagnostic-group warnings">
        <ul class="diagnostic-list">
          <li v-for="(warning, index) in warnings" :key="`warning-${index}`" class="diagnostic-item warning">
            <span class="message">{{ warning.message }}</span>
            <span 
              v-if="warning.lineNumber" 
              class="line-ref clickable" 
              @click="navigateToLine(warning.lineNumber)"
              @keydown.enter="navigateToLine(warning.lineNumber)"
              tabindex="0"
              role="button"
              :aria-label="`Go to line ${warning.lineNumber}`"
            >
              <i class="pi pi-arrow-right" />
              Line {{ warning.lineNumber }}
            </span>
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

.line-ref.clickable {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: var(--vscode-textLink-foreground);
  transition: all 0.2s ease;
  padding: 2px 6px;
  border-radius: 3px;
  background: transparent;
}

.line-ref.clickable:hover {
  color: var(--vscode-textLink-activeForeground);
  background: var(--vscode-list-hoverBackground);
  text-decoration: underline;
}

.line-ref.clickable:focus {
  outline: 1px solid var(--vscode-focusBorder);
  outline-offset: 2px;
}

.line-ref.clickable i {
  font-size: 0.75em;
  opacity: 0.7;
}

.line-ref.clickable:hover i {
  opacity: 1;
}
</style>
