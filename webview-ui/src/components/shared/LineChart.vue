<script setup lang="ts">
/**
 * LineChart - Chart.js wrapper component for energy convergence visualization
 * Provides interactive tooltips (US-4, G4, N1) and VS Code theme integration
 */
import { ref, onMounted, watch, onUnmounted, computed, nextTick } from 'vue';
import {
  Chart,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartConfiguration
} from 'chart.js';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DatasetConfig {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  tension?: number;
  borderWidth?: number;
  pointRadius?: number;
  pointHoverRadius?: number;
}

interface Props {
  /** X-axis labels */
  labels: (string | number)[];
  /** Chart datasets */
  datasets: DatasetConfig[];
  /** Chart title */
  title?: string;
  /** X-axis label */
  xAxisLabel?: string;
  /** Y-axis label */
  yAxisLabel?: string;
  /** Chart height in pixels */
  height?: number;
  /** Use logarithmic Y-axis for large ranges */
  logarithmic?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  height: 250,
  logarithmic: false
});

const canvasRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

// Generate unique ID for canvas to avoid Chart.js conflicts
const canvasId = `chart-${Math.random().toString(36).substring(2, 11)}`;

// Key for forcing canvas re-creation when data changes
const canvasKey = ref(0);

// Export chart as PNG image
const exportAsPNG = (fileNamePrefix?: string) => {
  if (!chartInstance) return;
  const url = chartInstance.toBase64Image();
  const link = document.createElement('a');
  const baseName = props.title?.replace(/[^a-z0-9_-]/gi, '_').toLowerCase() || 'chart';
  const fullName = fileNamePrefix ? `${fileNamePrefix}_${baseName}` : baseName;
  link.download = `${fullName}.png`;
  link.href = url;
  link.click();
};

// Export data as CSV
const exportAsCSV = () => {
  let csv = 'X,';
  csv += props.datasets.map(ds => ds.label).join(',') + '\n';
  
  for (let i = 0; i < props.labels.length; i++) {
    csv += props.labels[i] + ',';
    csv += props.datasets.map(ds => ds.data[i] ?? '').join(',') + '\n';
  }
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${props.title || 'data'}.csv`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
};

// VS Code theme colors (computed from CSS variables)
const getThemeColors = () => {
  const style = getComputedStyle(document.documentElement);
  return {
    text: style.getPropertyValue('--vscode-foreground').trim() || '#cccccc',
    grid: style.getPropertyValue('--vscode-panel-border').trim() || '#444444',
    primary: style.getPropertyValue('--vscode-button-background').trim() || '#0e639c',
    success: style.getPropertyValue('--vscode-testing-iconPassed').trim() || '#4ec9b0',
    warning: style.getPropertyValue('--vscode-editorWarning-foreground').trim() || '#cca700',
    error: style.getPropertyValue('--vscode-testing-iconFailed').trim() || '#f14c4c'
  };
};

// Default colors for datasets
const defaultColors = ['#0e639c', '#4ec9b0', '#cca700', '#f14c4c', '#9b59b6', '#3498db'];

// Destroy chart instance safely
const destroyChart = () => {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
};

const createChart = async () => {
  // Wait for next tick to ensure DOM is ready
  await nextTick();
  
  if (!canvasRef.value) return;

  // Destroy existing chart first
  destroyChart();

  const colors = getThemeColors();
  const disableAnimation = props.labels.length > 100;

  const config: ChartConfiguration<'line'> = {
    type: 'line',
    data: {
      labels: props.labels.map(String),
      datasets: props.datasets.map((ds, index) => ({
        label: ds.label,
        data: ds.data,
        borderColor: ds.borderColor || defaultColors[index % defaultColors.length],
        backgroundColor: ds.backgroundColor || 'transparent',
        tension: ds.tension ?? 0.2,
        borderWidth: ds.borderWidth ?? 2,
        pointRadius: ds.pointRadius ?? (props.labels.length > 50 ? 0 : 3),
        pointHoverRadius: ds.pointHoverRadius ?? 5,
        fill: false
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: disableAnimation ? false : { duration: 300 },
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        title: props.title
          ? {
              display: true,
              text: props.title,
              color: colors.text,
              font: { size: 14, weight: 'normal' }
            }
          : undefined,
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          titleColor: colors.text,
          bodyColor: colors.text,
          borderColor: colors.grid,
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (context) => {
              const value = context.parsed.y;
              if (value === null || value === undefined) return '';
              // Only use scientific notation for very small numbers (< 0.0001)
              // Don't use scientific notation for large numbers - they should be readable
              if (Math.abs(value) < 0.0001 && value !== 0) {
                return `${context.dataset.label}: ${value.toExponential(4)}`;
              }
              // For normal numbers, use appropriate decimal places
              if (Number.isInteger(value)) {
                return `${context.dataset.label}: ${value}`;
              }
              return `${context.dataset.label}: ${value.toFixed(6)}`;
            }
          }
        },
        legend: {
          display: props.datasets.length > 1,
          position: 'top',
          labels: {
            color: colors.text,
            usePointStyle: true,
            padding: 15
          }
        }
      },
      scales: {
        x: {
          title: props.xAxisLabel
            ? {
                display: true,
                text: props.xAxisLabel,
                color: colors.text
              }
            : undefined,
          ticks: { color: colors.text },
          grid: { color: colors.grid }
        },
        y: {
          type: props.logarithmic ? 'logarithmic' : 'linear',
          title: props.yAxisLabel
            ? {
                display: true,
                text: props.yAxisLabel,
                color: colors.text
              }
            : undefined,
          ticks: {
            color: colors.text,
            callback: function (tickValue: string | number) {
              const value = Number(tickValue);
              // Only use scientific notation for very small numbers
              if (Math.abs(value) < 0.0001 && value !== 0) {
                return value.toExponential(4);
              }
              
              // Calculate minimum decimals needed to distinguish all tick values
              const tickValues = (this as any).ticks.map((t: any) => Number(t.value));
              let decimals = 0;
              let maxDecimals = 10; // Safety limit
              
              // Find minimum decimals where all values are distinct when formatted
              while (decimals <= maxDecimals) {
                const formatted = tickValues.map((v: number) => v.toFixed(decimals));
                const uniqueValues = new Set(formatted);
                if (uniqueValues.size === tickValues.length) {
                  break;
                }
                decimals++;
              }
              
              // Use at least 3 decimals for better precision, up to 6 max for readability
              const finalDecimals = Math.min(Math.max(decimals, 3), 6);
              
              return value.toLocaleString(undefined, { 
                minimumFractionDigits: finalDecimals,
                maximumFractionDigits: finalDecimals 
              });
            }
          },
          grid: { color: colors.grid }
        }
      }
    }
  };

  chartInstance = new Chart(canvasRef.value, config);
};

// Initialize on mount
onMounted(() => {
  createChart();
  window.addEventListener('message', handleMessage);
});

// Recreate chart when data changes
watch(
  () => [props.labels, props.datasets],
  async () => {
    destroyChart();
    canvasKey.value++; // Force canvas re-creation
    await nextTick();
    createChart();
  },
  { deep: true }
);

// Cleanup on unmount
onUnmounted(() => {
  destroyChart();
  window.removeEventListener('message', handleMessage);
});

// Expose methods for parent components
defineExpose({
  exportAsPNG,
  exportAsCSV
});

// Handle theme changes
const handleMessage = (event: MessageEvent) => {
  if (event.data?.type === 'themeChanged') {
    createChart();
  }
};
</script>

<template>
  <div class="line-chart-container" :style="{ height: `${height}px` }">
    <canvas ref="canvasRef" :key="canvasKey" :id="canvasId" />
    <div v-if="!labels.length" class="no-data">
      No data available
    </div>
  </div>
</template>

<style scoped>
.line-chart-container {
  position: relative;
  width: 100%;
  padding: 8px;
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 6px;
}

.no-data {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--vscode-descriptionForeground);
  font-style: italic;
}
</style>
