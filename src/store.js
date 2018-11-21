import Vue from 'vue';
import Vuex from 'vuex';
import { InMemorySignalProtocolStore } from './InMemorySignalProtocolStore';

Vue.use(Vuex);

// core signal lib - added to window from index.html IMPROVE?
const ls = window.libsignal;
const KeyHelper = ls.KeyHelper;

export default new Vuex.Store({
    state: {
        // local session vars
        deviceId: null,
        registrationId: null,
        identityKeyPair: null,
        preKey: null,
        signedPreKey: null,

        // needs to be a SignalProtocolStore impl
        // used to build sessions and handle messages
        // holds pre-keys for other users
        store: null,

        // simulating a server for storing pre-keys
        server: {},

        // message store - move to server for universal retrieval
        messages: {},
    },
    mutations: {
        ['commit-account-registration'] (state, {deviceId, registrationId, identityKeyPair, preKey, signedPreKey}) {

            // build a new store on each account
            // when server based this should only happen once
            state.store = new InMemorySignalProtocolStore();

            state.deviceId = deviceId;
            state.registrationId = registrationId;

            // needs to be in SignalProtocolStore
            state.store.put('registrationId', registrationId);

            state.identityKeyPair = identityKeyPair;

            // needs to be in SignalProtocolStore
            state.store.put('identityKey', identityKeyPair);

            state.preKey = preKey;

            // needs to be in SignalProtocolStore
            state.store.storePreKey(preKey.keyId, preKey.keyPair);

            state.signedPreKey = signedPreKey;

            // needs to be in SignalProtocolStore
            state.store.storeSignedPreKey(signedPreKey.keyId, signedPreKey.keyPair);
        },
        // FIXME send to server
        ['commit-local-keys'] (state) {

            // NOTE: No private keys go to the server
            // not sure type is needed?
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

            Vue.set(state.server, `${state.registrationId}|${state.deviceId}`, reqObj);
        },
        // FIXME send to server
        ['commit-message'] (state, {id, ciphertext}) {
            console.log(`incoming message for ${id}: ${ciphertext}`);

            Vue.set(state.messages, `${id}`, ciphertext);
        },
    },
    actions: {
        // bootstraps a Signal device, registration, and keys
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
            const [registrationId, deviceId] = form.id.split('|');

            console.log(`Sending "${form.message}" to ${registrationId}|${deviceId}`);

            try {
                const address = new ls.SignalProtocolAddress(registrationId, deviceId);

                // Instantiate a SessionBuilder for a remote recipientId + deviceId tuple.
                // NOTE: requires the SignalProtocolStore to do it's magic
                // PRESUME this only needs to be done once and not on each message
                const sessionBuilder = new ls.SessionBuilder(state.store, address);

                // loads recipient's pre-keys - required to build shared key for encryption
                const recipientKeys = state.server[form.id];
                console.log(recipientKeys);

                // add recipient to session
                await sessionBuilder.processPreKey(recipientKeys);

                console.log(`pre key processed`);

                // encrypt
                const sessionCipher = new ls.SessionCipher(state.store, address);
                const ciphertext = await sessionCipher.encrypt(form.message);

                console.log(ciphertext);
                commit('commit-message', {id: form.id, ciphertext: ciphertext});

            } catch (ex) {
                console.error(ex);
            }
        },
        // FIXME UNTESTED
        async ['receive-message'] ({commit, dispatch, state, rootState}, form) {
            console.log(`Receiving from ${form.registrationId}${form.deviceId}`);

            const ciphertext = state.messages[`${form.registrationId}${form.deviceId}`];
            console.log(ciphertext);

            let fromAddress = new ls.SignalProtocolAddress(form.registrationId, form.deviceId);

            // FIXME wrong store...
            let sessionCipher = new ls.SessionCipher(state.store, fromAddress);

            const plaintext = await sessionCipher.decryptPreKeyWhisperMessage(ciphertext.body, 'binary');

            console.log(plaintext);
            let decryptedMessage = window.util.toString(plaintext);
            console.log(decryptedMessage);
        }
    },
    getters: {}
});
