<script setup lang="ts">
/**
 * TocSidebar - Table of Contents navigation sidebar
 * Uses PrimeVue 4 Tree for hierarchical display with state persistence (F1, F2, F3)
 */
import { computed, ref } from 'vue';
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

// Selection state (required for node-select)
const selectionKeys = ref<Record<string, boolean>>({});

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

// PrimeVue Tree navigation
// - Always navigate to lineNumber if present (both leaf and parent nodes)
// - Parent nodes also toggle expand/collapse
function onNodeSelect(node: any) {
  // PrimeVue node-select passes the node directly, not wrapped in event.node
  if (!node) {
    console.warn('TOC: No node in select event', node);
    return;
  }

  const lineNumber = (node as any).data?.lineNumber;
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const nodeKey = typeof node.key === 'string' ? node.key : undefined;

  console.log('TOC: Node selected', {
    title: node.label,
    lineNumber,
    hasChildren,
    nodeKey
  });

  // Always navigate if line number exists
  if (typeof lineNumber === 'number' && lineNumber > 0) {
    console.log('TOC: Navigating to line', lineNumber);
    goToLine(lineNumber);
  } else {
    console.warn('TOC: No valid line number', lineNumber);
  }

  // If parent node, also toggle expand/collapse
  if (hasChildren && nodeKey) {
    const isExpanded = !!expandedKeys.value[nodeKey];
    if (isExpanded) {
      onNodeCollapse(node);
    } else {
      onNodeExpand(node);
    }
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
        selectionMode="single"
        v-model:selectionKeys="selectionKeys"
        v-model:expandedKeys="expandedKeys"
        class="toc-tree"
        @node-select="onNodeSelect"
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

@media (max-width: 768px) {
  /* Overlay sidebar on small screens so main content stays visible */
  .toc-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    height: 100vh;
    z-index: 90;
    width: 260px;
    max-width: calc(100vw - 48px);
    border-right: 1px solid var(--vscode-panel-border);
  }
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

/* PrimeVue 4 Tree - Minimal VS Code Theme Integration */
/* Let PrimeVue handle the tree structure, just override colors */
:deep(.p-tree) {
  background: transparent;
  border: none;
  padding: 0.25rem;
  color: var(--vscode-foreground);
}

:deep(.p-tree-node-content) {
  padding: 0.375rem 0.5rem;
  border-radius: 4px;
  gap: 0.5rem;
}

:deep(.p-tree-node-content:hover) {
  background: var(--vscode-list-hoverBackground);
}

:deep(.p-tree-node-content.p-selected) {
  background: var(--vscode-list-activeSelectionBackground);
  color: var(--vscode-list-activeSelectionForeground);
}

:deep(.p-tree-node-label) {
  color: var(--vscode-foreground);
}

:deep(.p-tree-node-toggle-button) {
  color: var(--vscode-foreground);
  width: 1.25rem;
  height: 1.25rem;
}

:deep(.p-tree-node-toggle-button:hover) {
  background: var(--vscode-toolbar-hoverBackground);
}

:deep(.p-tree-node-icon) {
  color: var(--vscode-symbolIcon-fileForeground, var(--vscode-foreground));
}

/* Status color classes */
:deep(.text-success) {
  color: var(--vscode-testing-iconPassed, #4ec9b0) !important;
}

:deep(.text-warning) {
  color: var(--vscode-editorWarning-foreground, #cca700) !important;
}

:deep(.text-error) {
  color: var(--vscode-testing-iconFailed, #f14c4c) !important;
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
