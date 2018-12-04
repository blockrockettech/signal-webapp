<template>
    <div class="container">
        <header>
            <div v-if="deviceId && registrationId" class="row m-0">
                <div class="col-6 m-0 text-left"><router-link to="/friends">Friends</router-link></div>
                <div class="col-6 m-0 text-right"><router-link to="/account" class="">{{ deviceId }}-{{ registrationId }}</router-link></div>
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
