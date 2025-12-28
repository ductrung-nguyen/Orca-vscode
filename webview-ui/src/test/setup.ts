/**
 * Test setup file for Vitest
 */
import { config } from '@vue/test-utils';
import { vi } from 'vitest';

// Mock VS Code API
const mockVSCodeApi = {
  postMessage: vi.fn(),
  getState: vi.fn(() => null),
  setState: vi.fn()
};

// Make acquireVsCodeApi globally available
(globalThis as any).acquireVsCodeApi = vi.fn(() => mockVSCodeApi);

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  mockVSCodeApi.getState.mockReturnValue(null);
});

// PrimeVue global config
config.global.stubs = {
  // Stub PrimeVue components that need special handling
  teleport: true
};

// Mock ResizeObserver (not available in jsdom)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock canvas for Chart.js
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: [] })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => []),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn()
})) as any;
