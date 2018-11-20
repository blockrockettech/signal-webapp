import Vue from 'vue';
import Vuex from 'vuex';
import { InMemorySignalProtocolStore } from './InMemorySignalProtocolStore';

Vue.use(Vuex);

const ls = window.libsignal;

const KeyHelper = ls.KeyHelper;

export default new Vuex.Store({
    state: {
        deviceId: null,
        registrationId: null,
        identityKeyPair: null,
        preKey: null,
        signedPreKey: null,
        store: null,
        server: {},
        messages: {},
    },
    mutations: {
        ['commit-account-registration'] (state, {deviceId, registrationId, identityKeyPair, preKey, signedPreKey}) {

            state.store = new InMemorySignalProtocolStore();

            state.deviceId = deviceId;
            state.registrationId = registrationId;
            state.store.put('registrationId', registrationId);

            state.identityKeyPair = identityKeyPair;
            state.store.put('identityKey', identityKeyPair);

            state.preKey = preKey;
            state.store.storePreKey(preKey.keyId, preKey.keyPair);

            state.signedPreKey = signedPreKey;
            state.store.storeSignedPreKey(signedPreKey.keyId, signedPreKey.keyPair);
        },
        ['commit-local-keys'] (state) {

            let reqObj = {
                type: 'init',
                deviceId: state.deviceId,
                registrationId: state.registrationId,
                identityKey: state.identityKeyPair.pubKey,
                signedPreKey: {
                    keyId: state.signedPreKey.keyId,
                    publicKey: state.signedPreKey.keyPair.pubKey,
                    signature: state.signedPreKey.signature
                },
                preKey: {
                    keyId: state.preKey.keyId,
                    publicKey: state.preKey.keyPair.pubKey
                }
            };

            console.log(reqObj);

            Vue.set(state.server, `${state.registrationId}${state.deviceId}`, reqObj);
        },
        ['commit-message'] (state, {registrationId, deviceId, ciphertext}) {
            console.log(`incoming message for ${registrationId}${deviceId}: ${ciphertext}`);

            Vue.set(state.messages, `${registrationId}${deviceId}`, ciphertext);
        },
    },
    actions: {
        async ['generate-registration-id'] ({commit, dispatch, state, rootState}, form) {
            console.log(`Generating Registration ID for ${JSON.stringify(form)}`);

            const registrationId = KeyHelper.generateRegistrationId();
            console.log(registrationId);

            const identityKeyPair = await KeyHelper.generateIdentityKeyPair();
            console.log(identityKeyPair);

            const preKey = await KeyHelper.generatePreKey(registrationId);
            console.log(preKey);

            const signedPreKey = await KeyHelper.generateSignedPreKey(identityKeyPair, registrationId);
            console.log(signedPreKey);

            commit('commit-account-registration', {
                ...form,
                registrationId: registrationId,
                identityKeyPair: identityKeyPair,
                preKey: preKey,
                signedPreKey: signedPreKey
            });

            dispatch('send-keys-to-server', this.form);
        },
        async ['send-keys-to-server'] ({commit, dispatch, state, rootState}, form) {
            console.log(`Sending keys`);

            commit('commit-local-keys');
        },
        async ['send-message'] ({commit, dispatch, state, rootState}, form) {
            console.log(`Sending "${form.message}" to ${form.registrationId}${form.deviceId}`);

            const address = new ls.SignalProtocolAddress(form.registrationId, form.deviceId);

            // Instantiate a SessionBuilder for a remote recipientId + deviceId tuple.
            const sessionBuilder = new ls.SessionBuilder(state.store, address);

            try {
                const recipientKeys = state.server[ `${form.registrationId}${form.deviceId}`];
                console.log(recipientKeys);

                await sessionBuilder.processPreKey(recipientKeys);

                console.log(`pre key processed`);

                const sessionCipher = new ls.SessionCipher(state.store, address);
                const ciphertext = await sessionCipher.encrypt(form.message);

                console.log(ciphertext);
                commit('commit-message', {registrationId: form.registrationId, deviceId: form.deviceId, ciphertext: ciphertext});

            } catch (ex) {
                console.error(ex);
            }
        },
        async ['receive-message'] ({commit, dispatch, state, rootState}, form) {
            console.log(`Receiving from ${form.registrationId}${form.deviceId}`);

            const ciphertext = state.messages[`${form.registrationId}${form.deviceId}`];
            console.log(ciphertext);


            let fromAddress = new ls.SignalProtocolAddress(form.registrationId, form.deviceId);
            let sessionCipher = new ls.SessionCipher(state.store, fromAddress);

            const plaintext = await sessionCipher.decryptPreKeyWhisperMessage(ciphertext.body, 'binary')

            console.log(plaintext);
            let decryptedMessage = window.util.toString(plaintext);
            console.log(decryptedMessage);

            //
            // // Instantiate a SessionBuilder for a remote recipientId + deviceId tuple.
            // const sessionBuilder = new ls.SessionBuilder(state.store, address);
            //
            // try {
            //     const recipientKeys = state.server[ `${form.registrationId}${form.deviceId}`];
            //     console.log(recipientKeys);
            //
            //     await sessionBuilder.processPreKey(recipientKeys);
            //
            //     console.log(`pre key processed`);
            //
            //     const sessionCipher = new ls.SessionCipher(state.store, address);
            //     const ciphertext = await sessionCipher.encrypt(form.message);
            //
            //     console.log(ciphertext);
            //     commit('commit-message', {registrationId: form.registrationId, deviceId: form.deviceId, ciphertext: ciphertext});
            //
            // } catch (ex) {
            //     console.error(ex);
            // }
        },
    },
    getters: {}
});
