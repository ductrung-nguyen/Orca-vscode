<script setup lang="ts">
/**
 * MetricCard - A reusable card component for displaying labeled metrics
 * Used for summary statistics like Energy, Status, Method, etc.
 */
import Tag from 'primevue/tag';

interface Props {
  /** Display label */
  label: string;
  /** Display value */
  value: string | number | null | undefined;
  /** Optional unit suffix (e.g., 'Hartree', 'eV') */
  unit?: string;
  /** Optional status indicator for visual styling */
  status?: 'success' | 'warning' | 'error' | 'info';
  /** Optional icon class (e.g., 'pi pi-check') */
  icon?: string;
  /** Whether to use monospace font for the value */
  mono?: boolean;
  /** Placeholder text when value is null/undefined */
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  mono: false,
  placeholder: 'N/A'
});

// Map status to PrimeVue Tag severity
const severityMap = {
  success: 'success',
  warning: 'warning',
  error: 'danger',
  info: 'info'
} as const;

// Format display value
const displayValue = () => {
  if (props.value === null || props.value === undefined) {
    return props.placeholder;
  }
  if (typeof props.value === 'number') {
    // Only use scientific notation for very small numbers (< 0.0001)
    if (Math.abs(props.value) < 0.0001 && props.value !== 0) {
      return props.value.toExponential(6);
    }
    // For integers, don't show decimals
    if (Number.isInteger(props.value)) {
      return props.value.toString();
    }
    // For normal numbers, show appropriate precision
    return props.value.toFixed(6);
  }
  return props.value;
};
</script>

<template>
  <div class="metric-card">
    <div class="metric-label">
      <i v-if="icon" :class="icon" class="metric-icon" />
      <span>{{ label }}</span>
    </div>
    <div class="metric-value" :class="{ 'font-mono': mono }">
      <span class="value-text">{{ displayValue() }}</span>
      <span v-if="unit && value !== null && value !== undefined" class="value-unit">
        {{ unit }}
      </span>
      <Tag
        v-if="status"
        :severity="severityMap[status]"
        :value="status"
        class="status-tag"
      />
    </div>
  </div>
</template>

<style scoped>
.metric-card {
  padding: 12px 16px;
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 6px;
  transition: border-color 0.2s ease;
}

.metric-card:hover {
  border-color: var(--vscode-focusBorder);
}

.metric-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8em;
  color: var(--vscode-descriptionForeground);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-icon {
  font-size: 0.9em;
}

.metric-value {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.value-text {
  font-size: 1.1em;
  font-weight: 600;
  color: var(--vscode-foreground);
}

.value-unit {
  font-size: 0.85em;
  color: var(--vscode-descriptionForeground);
}

.font-mono {
  font-family: var(--vscode-editor-font-family);
}

.status-tag {
  font-size: 0.7em;
  padding: 2px 6px;
}

/* Status-specific styling */
.metric-card:has(.p-tag-success) {
  border-left: 3px solid var(--vscode-testing-iconPassed, #4ec9b0);
}

.metric-card:has(.p-tag-danger) {
  border-left: 3px solid var(--vscode-testing-iconFailed, #f14c4c);
}

.metric-card:has(.p-tag-warning) {
  border-left: 3px solid var(--vscode-editorWarning-foreground, #cca700);
}
</style>
