/**
 * Unit tests for MetricCard component
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MetricCard from './MetricCard.vue';
import PrimeVue from 'primevue/config';

const mountWithPrimeVue = (props: { label: string; value: string | number | null | undefined; unit?: string; status?: 'success' | 'warning' | 'error' | 'info'; icon?: string; mono?: boolean; placeholder?: string }) => {
  return mount(MetricCard, {
    props,
    global: {
      plugins: [PrimeVue]
    }
  });
};

describe('MetricCard', () => {
  it('renders label and value correctly', () => {
    const wrapper = mountWithPrimeVue({
      label: 'Energy',
      value: -76.123456
    });

    expect(wrapper.text()).toContain('Energy');
    expect(wrapper.text()).toContain('-76.123456');
  });

  it('displays unit when provided', () => {
    const wrapper = mountWithPrimeVue({
      label: 'Time',
      value: 42.5,
      unit: 'sec'
    });

    expect(wrapper.text()).toContain('42.500000');
    expect(wrapper.text()).toContain('sec');
  });

  it('shows placeholder when value is null', () => {
    const wrapper = mountWithPrimeVue({
      label: 'Energy',
      value: null
    });

    expect(wrapper.text()).toContain('N/A');
  });

  it('shows custom placeholder when provided', () => {
    const wrapper = mountWithPrimeVue({
      label: 'Energy',
      value: undefined,
      placeholder: 'Not calculated'
    });

    expect(wrapper.text()).toContain('Not calculated');
  });

  it('formats small numbers in scientific notation', () => {
    const wrapper = mountWithPrimeVue({
      label: 'Delta E',
      value: 0.00000123
    });

    expect(wrapper.text()).toContain('1.230000e-6');
  });

  it('renders status tag when status provided', () => {
    const wrapper = mountWithPrimeVue({
      label: 'Status',
      value: 'Converged',
      status: 'success'
    });

    const tag = wrapper.findComponent({ name: 'Tag' });
    expect(tag.exists()).toBe(true);
    expect(tag.props('severity')).toBe('success');
  });

  it('renders icon when provided', () => {
    const wrapper = mountWithPrimeVue({
      label: 'Energy',
      value: -76.0,
      icon: 'pi pi-bolt'
    });

    const icon = wrapper.find('.metric-icon');
    expect(icon.exists()).toBe(true);
    expect(icon.classes()).toContain('pi');
    expect(icon.classes()).toContain('pi-bolt');
  });

  it('applies monospace font when mono prop is true', () => {
    const wrapper = mountWithPrimeVue({
      label: 'Energy',
      value: -76.0,
      mono: true
    });

    const valueEl = wrapper.find('.metric-value');
    expect(valueEl.classes()).toContain('font-mono');
  });

  it('does not show unit when value is null', () => {
    const wrapper = mountWithPrimeVue({
      label: 'Energy',
      value: null,
      unit: 'Hartree'
    });

    expect(wrapper.text()).not.toContain('Hartree');
  });
});
