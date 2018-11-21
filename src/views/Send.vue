<template>
    <div>
        <h1>Send</h1>

        <h2><span class="badge badge-warning">From:</span> {{ registrationId }}|{{ deviceId }}</h2>

        <div v-if="registrationId">
            <b-form @submit="onSubmit" v-if="show" inline>

                <b-form-select id="id" required v-model="form.id" :options="friends" class="mb-2 mr-sm-2 mb-sm-0"></b-form-select>

                <b-form-input id="message"
                              type="text"
                              v-model="form.message"
                              required
                              class="mb-2 mr-sm-2 mb-sm-0"
                              placeholder="Message">
                </b-form-input>

                <b-button type="submit" variant="primary">Send</b-button>
            </b-form>
        </div>
        <div v-else>
            <b-alert variant="danger" show class="text-center">Not registered!</b-alert>
        </div>

        <div v-if="sent && sent.length > 0">
            <b-alert variant="success" show class="text-center">{{ sent }}</b-alert>
        </div>

        <!--<hr/>-->
        <!--<span class="text-muted small mr-4">Signal Store</span><br/>-->
        <!--<code>{{ store }}</code>-->
    </div>
</template>

<script>
    import { mapGetters, mapState } from 'vuex';

    export default {
        name: 'send',
        components: {},
        data () {
            return {
                form: {
                    id: '',
                    message: ''
                },
                show: true
            };
        },
        computed: {
            ...mapState([
                'registrationId', 'deviceId', 'store', 'sent', 'friends'
            ]),

        },
        methods: {
            onSubmit (evt) {
                evt.preventDefault();
                // alert(JSON.stringify(this.form));
                this.$store.dispatch('send-message', this.form);
            },
            arrayBufferToBase64 (buffer) {
                if (!buffer) return;

                let binary = '';
                let bytes = new Uint8Array(buffer);
                let len = bytes.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                return window.btoa(binary);
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
