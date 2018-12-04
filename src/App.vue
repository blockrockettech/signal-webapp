<template>
    <div class="container">
        <header class="text-center">
            <div v-if="deviceId && registrationId">
                <router-link to="/messages" class="p-3">Messages</router-link>
                &bull;
                <router-link to="/friends" class="p-3">Friends</router-link>
                &bull;
                <router-link to="/account" class="p-3">Account</router-link>
                <code class="ml-5">👽 {{ deviceId }}-{{ registrationId }}</code>
            </div>
            <div v-else>
                <router-link to="/" class="p-3">Home</router-link>
            </div>
        </header>
        <main id="app">
            <router-view/>
        </main>
        <footer>
        </footer>
    </div>
</template>

<script>
    import { mapGetters, mapState } from 'vuex';

    export default {
        name: 'app',
        components: {},
        computed: {
            ...mapState(['registrationId', 'deviceId']),
        },
        methods: {

        }
    };
</script>

<style lang="scss">
    $primary: #41c0d1;

    $font-family-base: 'Avenir', Helvetica, Arial, sans-serif;

    @import '../node_modules/bootstrap/scss/bootstrap.scss';
    @import '../node_modules/bootstrap-vue/dist/bootstrap-vue.css';

    body {
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        color: #2c3e50;
        background-color: #f6f6f6;
    }

    h1 {
        text-align: center;
    }

    #nav {
        padding: 30px;
        a {
            font-weight: bold;
            color: #2c3e50;
            &.router-link-exact-active {
                color: #41c0d1;
            }
        }
    }

    footer {
        text-align: center;
    }
</style>
