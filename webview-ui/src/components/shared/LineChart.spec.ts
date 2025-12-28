/**
 * Unit tests for LineChart component
 */
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import LineChart from './LineChart.vue';

describe('LineChart', () => {
  const defaultProps = {
    labels: [1, 2, 3, 4, 5],
    datasets: [
      {
        label: 'Energy',
        data: [-76.0, -76.1, -76.2, -76.3, -76.35]
      }
    ]
  };

  it('renders canvas element', () => {
    const wrapper = mount(LineChart, { props: defaultProps });
    const canvas = wrapper.find('canvas');
    expect(canvas.exists()).toBe(true);
  });

  it('applies custom height', () => {
    const wrapper = mount(LineChart, {
      props: { ...defaultProps, height: 400 }
    });
    const container = wrapper.find('.line-chart-container');
    expect(container.attributes('style')).toContain('height: 400px');
  });

  it('shows no data message when labels empty', () => {
    const wrapper = mount(LineChart, {
      props: { labels: [], datasets: [] }
    });
    expect(wrapper.text()).toContain('No data available');
  });

  it('accepts title prop', () => {
    const wrapper = mount(LineChart, {
      props: { ...defaultProps, title: 'Energy Convergence' }
    });
    expect(wrapper.vm.$props.title).toBe('Energy Convergence');
  });

  it('accepts axis label props', () => {
    const wrapper = mount(LineChart, {
      props: {
        ...defaultProps,
        xAxisLabel: 'Iteration',
        yAxisLabel: 'Energy (Hartree)'
      }
    });
    expect(wrapper.vm.$props.xAxisLabel).toBe('Iteration');
    expect(wrapper.vm.$props.yAxisLabel).toBe('Energy (Hartree)');
  });

  it('handles multiple datasets', () => {
    const wrapper = mount(LineChart, {
      props: {
        labels: [1, 2, 3],
        datasets: [
          { label: 'RMS Gradient', data: [0.1, 0.05, 0.01] },
          { label: 'Max Gradient', data: [0.2, 0.1, 0.02] }
        ]
      }
    });
    expect(wrapper.vm.$props.datasets).toHaveLength(2);
  });

  it('unmounts without error', () => {
    const wrapper = mount(LineChart, { props: defaultProps });
    expect(() => wrapper.unmount()).not.toThrow();
  });
});
