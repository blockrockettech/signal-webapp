<template>
    <div  class="container">
        <main id="app">
            <router-view/>
        </main>
        <footer>
            <div id="nav">
                <router-link to="/">Home</router-link>
                &bull;
                <router-link to="/register">Register</router-link>
                &bull;
                <router-link to="/about">About</router-link>
            </div>
        </footer>
    </div>
</template>

<style lang="scss">
    body {
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        color: #2c3e50;
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
                color: #42b983;
            }
        }
    }

    footer {
        text-align: center;
    }
</style>
