<template>
    <div>
        <h1>Receive</h1>

        <h2><span class="badge badge-warning">To:</span> {{ registrationId }}|{{ deviceId }}</h2>

        <div v-if="registrationId">
            <b-form @submit="onSubmit" v-if="show" inline>
                <b-form-select id="id" required v-model="form.id" :options="friends" class="mb-2 mr-sm-2 mb-sm-0"></b-form-select>

                <b-button type="submit" variant="primary">Receive</b-button>
            </b-form>
        </div>
        <div v-else>
            <b-alert variant="danger" show class="text-center">Not registered!</b-alert>
        </div>

        <div v-if="messages && messages.length > 0">
            <b-alert variant="success" show class="text-center">{{ messages }}</b-alert>
        </div>
    </div>
</template>

<script>
    import { mapGetters, mapState } from 'vuex';

    export default {
        name: 'receive',
        components: {},
        data () {
            return {
                form: {
                    id: ''
                },
                show: true
            };
        },
        computed: {
            ...mapState([
                'registrationId', 'deviceId', 'store', 'messages', 'friends'
            ]),

        },
        methods: {
            onSubmit (evt) {
                evt.preventDefault();
                // alert(JSON.stringify(this.form));
                this.$store.dispatch('receive-message', this.form)
            }
        }
    };
</script>

<style lang="scss">
    div {
        margin-bottom: 20px;
        margin-top: 20px;
    }
</style>
