/**
 * Composable for persistent webview state management
 * Uses VS Code's webview state API to persist data across panel visibility changes
 */
import { ref, watch, onMounted, type Ref } from 'vue';
import { useVSCodeApi } from './useVSCodeApi';

const STATE_VERSION = 1;

interface StoredState {
  version: number;
  [key: string]: unknown;
}

/**
 * Create a reactive ref that persists to VS Code webview state
 * @param key - Unique key for this state value
 * @param defaultValue - Default value if no stored state exists
 * @returns Reactive ref that auto-saves on change
 */
export function useWebviewState<T>(key: string, defaultValue: T): Ref<T> {
  const { vscode } = useVSCodeApi();
  const state = ref<T>(defaultValue) as Ref<T>;

  // Restore state on mount
  onMounted(() => {
    try {
      const saved = vscode.getState() as StoredState | null;
      if (saved?.version === STATE_VERSION && saved[key] !== undefined) {
        state.value = saved[key] as T;
      }
    } catch (e) {
      console.warn('Failed to restore webview state:', e);
    }
  });

  // Save state on change
  watch(
    state,
    (newValue) => {
      try {
        const currentState = (vscode.getState() || { version: STATE_VERSION }) as StoredState;
        vscode.setState({ ...currentState, version: STATE_VERSION, [key]: newValue });
      } catch (e) {
        console.warn('Failed to save webview state:', e);
      }
    },
    { deep: true }
  );

  return state;
}

/**
 * Get the current stored state (read-only snapshot)
 */
export function getStoredState(): StoredState | null {
  try {
    const { vscode } = useVSCodeApi();
    return vscode.getState() as StoredState | null;
  } catch {
    return null;
  }
}

/**
 * Clear all stored state
 */
export function clearStoredState(): void {
  try {
    const { vscode } = useVSCodeApi();
    vscode.setState({ version: STATE_VERSION });
  } catch (e) {
    console.warn('Failed to clear webview state:', e);
  }
}
