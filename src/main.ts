import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import TDesign from 'tdesign-vue-next';
import App from './App.vue';
import router from './router';

import 'tdesign-vue-next/es/style/index.css';
import './styles/global.css';

const app = createApp(App);
const pinia = createPinia();

pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.use(router);
app.use(TDesign);

app.mount('#app');
