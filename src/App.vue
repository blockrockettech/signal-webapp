<template>
    <div class="container">
        <header class="text-center">
            <img src="./assets/odin-Hires-icon.png" style="height: 100px;"/>
        </header>
        <main id="app">
            <router-view/>
        </main>
        <footer>
            <div id="nav">
                <router-link to="/" class="p-3">Home</router-link>
                &bull;
                <router-link to="/register" class="p-3">Register</router-link>
                &bull;
                <router-link to="/friends" class="p-3">Friends</router-link>
                &bull;
                <router-link to="/send" class="p-3">Send</router-link>
                &bull;
                <router-link to="/receive" class="p-3">Receive</router-link>
                &bull;
                <router-link to="/about" class="p-3">About</router-link>
            </div>
        </footer>
    </div>
</template>

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
