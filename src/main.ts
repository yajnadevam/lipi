/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'
import { inject } from '@vercel/analytics'
import { injectSpeedInsights } from '@vercel/speed-insights' 
 
// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

const app = createApp(App)

registerPlugins(app)
inject()
injectSpeedInsights()

app.mount('#app')
