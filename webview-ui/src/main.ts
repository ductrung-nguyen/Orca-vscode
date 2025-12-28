/**
 * Vue application entry point
 * Mounts the dashboard app and configures PrimeVue 4
 */
import { createApp } from "vue";
import PrimeVue from "primevue/config";
import Aura from "@primevue/themes/aura";
import App from "./App.vue";

// Import PrimeIcons
import "primeicons/primeicons.css";

// Import custom CSS (VS Code theme integration)
import "./styles/primevue-vscode.css";

// Create Vue application
const app = createApp(App);

// Configure PrimeVue 4 with Aura preset (default options)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      cssLayer: {
        name: "primevue",
        order: "theme, base, primevue",
      },
    },
  }
});

// Initial data is accessed via window.initialData in App.vue
app.provide("initialData", window.initialData);

// Mount the application
app.mount("#app");
