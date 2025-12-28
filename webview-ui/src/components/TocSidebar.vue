<script setup lang="ts">
/**
 * TocSidebar - Table of Contents navigation sidebar
 * Uses PrimeVue Tree for hierarchical display with state persistence (F1, F2, F3)
 */
import { computed } from 'vue';
import Tree from 'primevue/tree';
import type { TreeNode } from 'primevue/treenode';
import type { TocEntry } from '@/types/ParsedResults';
import { useVSCodeApi } from '@/composables/useVSCodeApi';
import { useWebviewState } from '@/composables/useWebviewState';

interface Props {
  /** TOC entries from parsed results */
  entries: TocEntry[];
  /** Optional title */
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Contents'
});

const { goToLine } = useVSCodeApi();

// Persisted expanded state (F3)
const expandedKeys = useWebviewState<Record<string, boolean>>('tocExpandedKeys', {});

// Status to icon mapping
const statusIcons: Record<string, string> = {
  success: 'pi pi-check-circle text-success',
  warning: 'pi pi-exclamation-triangle text-warning',
  error: 'pi pi-times-circle text-error'
};

// Convert TocEntry to PrimeVue TreeNode format
const convertEntry = (entry: TocEntry): TreeNode => {
  // Determine icon based on state and children
  let icon = entry.icon;
  if (!icon) {
    if (entry.status) {
      icon = statusIcons[entry.status];
    } else if (entry.children && entry.children.length > 0) {
      icon = 'pi pi-folder';
    } else {
      icon = 'pi pi-file'; // or 'pi pi-circle-fill' for a dot
    }
  }

  return {
    key: entry.id,
    label: entry.title,
    icon: icon,
    data: {
      lineNumber: entry.lineNumber,
      status: entry.status,
      isParent: entry.isParent
    },
    children: entry.children?.map(convertEntry),
    leaf: !entry.children?.length
  };
};

const treeNodes = computed<TreeNode[]>(() => props.entries.map(convertEntry));

// Handle node click (F2)
function onNodeClick(event: any) {
  const node = event.node;
  if (node.data?.lineNumber) {
    goToLine(node.data.lineNumber);
  }
}

// Handle expand/collapse
function onNodeExpand(node: TreeNode) {
  if (node.key) {
    expandedKeys.value = { ...expandedKeys.value, [node.key]: true };
  }
}

function onNodeCollapse(node: TreeNode) {
  if (node.key) {
    const newKeys = { ...expandedKeys.value };
    delete newKeys[node.key as string];
    expandedKeys.value = newKeys;
  }
}
</script>

<template>
  <aside class="toc-sidebar">
    <div class="toc-header">
      <span class="toc-title">{{ title }}</span>
      <span class="toc-count">{{ entries.length }}</span>
    </div>

    <div class="toc-content">
      <Tree
        v-if="treeNodes.length > 0"
        :value="treeNodes"
        v-model:expandedKeys="expandedKeys"
        class="toc-tree"
        @node-click="onNodeClick"
        @node-expand="onNodeExpand"
        @node-collapse="onNodeCollapse"
      />

      <div v-else class="toc-empty">
        <span class="pi pi-info-circle"></span>
        <p>No sections found</p>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.toc-sidebar {
  width: 260px;
  min-width: 200px;
  max-width: 320px;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--vscode-panel-border);
  background: var(--vscode-sideBar-background);
}

.toc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--vscode-panel-border);
}

.toc-title {
  font-size: 0.8em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--vscode-sideBarSectionHeader-foreground);
}

.toc-count {
  font-size: 0.75em;
  padding: 2px 6px;
  border-radius: 10px;
  background: var(--vscode-badge-background);
  color: var(--vscode-badge-foreground);
}

.toc-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.toc-tree {
  font-size: 0.9em;
}

/* PrimeVue Tree overrides - VS Code file tree style */
:deep(.p-tree) {
  background: transparent;
  border: none;
  padding: 0;
}

:deep(.p-tree-container) {
  padding: 0;
  margin: 0;
}

:deep(.p-treenode) {
  padding: 0;
}

/* Remove white background from tree nodes - make it like VS Code explorer */
:deep(.p-treenode-content) {
  padding: 2px 8px;
  border-radius: 0;
  cursor: pointer;
  transition: background-color 0.1s ease;
  display: flex;
  align-items: center;
  background: transparent !important;
}

:deep(.p-treenode-content:hover) {
  background: var(--vscode-list-hoverBackground) !important;
}

:deep(.p-treenode-content.p-highlight) {
  background: var(--vscode-list-activeSelectionBackground) !important;
  color: var(--vscode-list-activeSelectionForeground);
}

:deep(.p-treenode-label) {
  font-size: 0.85em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  color: var(--vscode-foreground);
}

/* Tree indentation lines - VS Code style */
:deep(.p-treenode-children) {
  padding-left: 12px;
  margin-left: 7px;
  border-left: 1px solid var(--vscode-tree-indentGuidesStroke, rgba(255,255,255,0.1));
}

:deep(.p-tree-toggler) {
  width: 16px;
  height: 16px;
  margin-right: 2px;
  color: var(--vscode-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.7;
}

:deep(.p-tree-toggler:hover) {
  opacity: 1;
  background: transparent;
}

/* Chevron icons for tree toggle */
:deep(.p-tree-toggler-icon) {
  font-size: 0.7em;
}

:deep(.p-treenode-icon) {
  margin-right: 6px;
  font-size: 0.85em;
  width: 1em;
  text-align: center;
  flex-shrink: 0;
  opacity: 0.9;
}

/* Leaf nodes without toggle should align properly */
:deep(.p-treenode-leaf > .p-treenode-content) {
  padding-left: 26px;
}

/* Status color classes */
:deep(.text-success) {
  color: var(--vscode-testing-iconPassed, #4ec9b0);
}

:deep(.text-warning) {
  color: var(--vscode-editorWarning-foreground, #cca700);
}

:deep(.text-error) {
  color: var(--vscode-testing-iconFailed, #f14c4c);
}

.toc-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  color: var(--vscode-descriptionForeground);
  text-align: center;
}

.toc-empty .pi {
  font-size: 2em;
  margin-bottom: 8px;
  opacity: 0.5;
}

.toc-empty p {
  margin: 0;
  font-size: 0.9em;
}
</style>
