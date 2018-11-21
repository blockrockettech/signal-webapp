import Vue from 'vue';
import Router from 'vue-router';
import Home from './views/Home';
import About from './views/About';
import Register from './views/Register';
import Send from './views/Send';
import Receive from './views/Receive';
import Friends from './views/Friends';

Vue.use(Router);

export default new Router({
    mode: 'history',
    base: process.env.BASE_URL,
    routes: [
        {
            path: '/',
            name: 'home',
            component: Home
        },
        {
            path: '/about',
            name: 'about',
            component: About
        },
        {
            path: '/friends',
            name: 'friends',
            component: Friends
        },
        {
            path: '/register',
            name: 'register',
            component: Register
        },
        {
            path: '/send',
            name: 'send',
            component: Send
        },
        {
            path: '/receive',
            name: 'receive',
            component: Receive
        }
    ]
});
