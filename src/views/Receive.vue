<template>
    <div>
        <h1>Receive</h1>

        <div v-if="registrationId">
            <b-form @submit="onSubmit" v-if="show" inline>
                <b-form-input id="registrationId"
                              type="text"
                              v-model="form.registrationId"
                              required
                              class="mb-2 mr-sm-2 mb-sm-0"
                              placeholder="registrationId">
                </b-form-input>

                <b-form-input id="deviceId"
                              type="text"
                              v-model="form.deviceId"
                              required
                              class="mb-2 mr-sm-2 mb-sm-0"
                              placeholder="deviceId">
                </b-form-input>

                <b-button type="submit" variant="primary">Receive</b-button>
            </b-form>
        </div>
        <div v-else>
            <b-alert variant="danger" show class="text-center">Not registered!</b-alert>
        </div>

        <hr/>
        <span class="text-muted small mr-4">Signal Store</span><br/>
        <code>{{ store }}</code>

        <hr/>
        <span class="text-muted small mr-4">Signal Server</span><br/>
        <code>{{ server }}</code>

        <hr/>
        <span class="text-muted small mr-4">Signal Encrypted Messages</span><br/>
        <code>{{ messages }}</code>
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
                    deviceId: '',
                    registrationId: ''
                },
                show: true
            };
        },
        computed: {
            ...mapState([
                'registrationId', 'store', 'server', 'messages'
            ]),

        },
        methods: {
            onSubmit (evt) {
                evt.preventDefault();
                // alert(JSON.stringify(this.form));
                this.$store.dispatch('receive-message', this.form);
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
