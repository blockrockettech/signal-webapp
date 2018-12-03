import Vue from 'vue';
import Router from 'vue-router';
import About from './views/About';
import Register from './views/Register';
import Friends from './views/Friends';
import Messages from './views/Messages';

Vue.use(Router);

export default new Router({
    mode: 'history',
    base: process.env.BASE_URL,
    routes: [
        {
            path: '/',
            name: 'home',
            component: Register
        },
        {
            path: '/about',
            name: 'about',
            component: About
        },
        {
            path: '/register',
            name: 'register',
            component: Register
        },
        {
            path: '/friends',
            name: 'friends',
            component: Friends
        },
        {
            path: '/messages',
            name: 'messages',
            component: Messages
        }
    ]
});
