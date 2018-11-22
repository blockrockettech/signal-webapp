import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import Vue2Filters from 'vue2-filters';
import BootstrapVue from 'bootstrap-vue';

Vue.use(BootstrapVue);

Vue.use(Vue2Filters);

Vue.config.productionTip = false;

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount('#app');
