import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import Vue2Filters from 'vue2-filters';
import BootstrapVue from 'bootstrap-vue';
import Storage from 'vue-ls';

const options = {
    namespace: 'vuejs__', // key prefix
    name: 'ls', // name variable Vue.[ls] or this.[$ls],
    storage: 'local', // storage name session, local, memory
};

Vue.use(Storage, options);

Vue.use(BootstrapVue);

Vue.use(Vue2Filters);

Vue.config.productionTip = false;

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount('#app');
