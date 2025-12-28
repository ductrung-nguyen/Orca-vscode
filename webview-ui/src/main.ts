/**
 * Vue application entry point
 * Mounts the dashboard app and configures PrimeVue
 */
import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import App from './App.vue';

// Import PrimeIcons
import 'primeicons/primeicons.css';

// Import custom CSS (includes PrimeVue variable overrides)
import './styles/primevue-vscode.css';

// Create Vue application
const app = createApp(App);

// Configure PrimeVue
app.use(PrimeVue, {
  ripple: false, // Disable ripple effect for performance
  inputStyle: 'outlined'
});

// Initial data is accessed via window.initialData in App.vue
app.provide('initialData', window.initialData);

// Mount the application
app.mount('#app');
