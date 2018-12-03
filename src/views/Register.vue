<template>
    <div>
        <h1>Register</h1>

        <div v-if="!registrationId">
            <b-form @submit="onSubmit" v-if="show" inline>
                <b-form-input id="deviceId"
                              type="text"
                              v-model="form.deviceId"
                              required
                              class="mb-2 mr-sm-2 mb-sm-0"
                              placeholder="Device ID">
                </b-form-input>

                <b-button type="submit" variant="primary">Register</b-button>
            </b-form>
        </div>
        <div v-else>
            <router-link to="/friends" class="float-right">Friends</router-link>
        </div>


        <!--<div v-else>-->
            <!--<b-alert variant="primary" show class="text-center">{{ deviceId }} has registered!</b-alert>-->
        <!--</div>-->

        <div class="row">
            <div v-if="deviceId" class="col">
                <span class="text-muted small mr-4">Device ID</span><br/>
                <code>{{ deviceId }}</code>
            </div>
            <div v-if="registrationId" class="col">
                <span class="text-muted small mr-4">Registration ID</span><br/>
                <code>{{ registrationId }}</code>
            </div>
            <div v-if="registrationId && deviceId" class="col">
                <span class="text-muted small mr-4">Combo ID</span><br/>
                <code>{{ deviceId }}-{{ registrationId }}</code>
            </div>
        </div>

        <div v-if="registrationId">
            <span class="text-muted small mr-4">Identity Key Pair</span><br/>
            PubKey <code>{{ arrayBufferToBase64(identityKeyPair.pubKey) }}</code><br/>
            PrivKey <code>{{ arrayBufferToBase64(identityKeyPair.privKey) }}</code>
        </div>

        <div v-if="preKey">
            <span class="text-muted small mr-4">Pre Key</span><br/>
            KeyId <code>{{ preKey.keyId}}</code><br/>
            PubKey <code>{{ arrayBufferToBase64(preKey.keyPair.pubKey) }}</code><br/>
            PrivKey <code>{{ arrayBufferToBase64(preKey.keyPair.privKey) }}</code>
        </div>

        <div v-if="signedPreKey">
            <span class="text-muted small mr-4">Signed Pre Key</span><br/>
            KeyId <code>{{ signedPreKey.keyId}}</code><br/>
            PubKey <code>{{ arrayBufferToBase64(signedPreKey.keyPair.pubKey) }}</code><br/>
            PrivKey <code>{{ arrayBufferToBase64(signedPreKey.keyPair.privKey) }}</code><br/>
            Signature <code>{{ arrayBufferToBase64(signedPreKey.signature) }}</code>
        </div>

        <hr/>
        <span class="text-muted small mr-4">Signal Store</span><br/>
        <code>{{ store }}</code>
    </div>
</template>

<script>
    import { mapGetters, mapState } from 'vuex';

    export default {
        name: 'register',
        components: {},
        data () {
            return {
                form: {
                    deviceId: ''
                },
                show: true
            };
        },
        computed: {
            ...mapState([
                'name', 'deviceId', 'registrationId', 'identityKeyPair', 'preKey', 'signedPreKey', 'store'
            ]),
        },
        methods: {
            onSubmit (evt) {
                evt.preventDefault();
                // alert(JSON.stringify(this.form));
                this.$store.dispatch('generate-registration-id', this.form);
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
