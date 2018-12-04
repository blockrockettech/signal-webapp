import Vue from 'vue';
import Router from 'vue-router';
import SignIn from './views/SignIn';
import Account from './views/Account';
import Friends from './views/Friends';
import Messages from './views/Messages';

Vue.use(Router);

export default new Router({
    mode: 'history',
    base: process.env.BASE_URL,
    routes: [
        {
            path: '/',
            name: 'sign-in',
            component: SignIn
        },
        {
            path: '/account',
            name: 'register',
            component: Account
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
