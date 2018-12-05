import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
import createPersistedState from 'vuex-persistedstate'
import { InMemorySignalProtocolStore } from './InMemorySignalProtocolStore';

/* global dcodeIO */

Vue.use(Vuex);

// core signal lib - added to window from index.html IMPROVE?
const ls = window.libsignal;
const KeyHelper = ls.KeyHelper;

let API_URL = (process.env.NODE_ENV === 'development') ? 'http://localhost:3000' : 'https://osmmessenger.ml';
console.log(`Using API`, API_URL);

const api = axios.create({
    baseURL: `${API_URL}/`,
});

const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    let bytes = new Uint8Array(buffer);
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

const base64ToArrayBuffer = (base64) => {
    let binary_string = window.atob(base64);
    let len = binary_string.length;
    let bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
};

// Util import from src/helpers.js
const util = (function () {
    'use strict';

    let StaticArrayBufferProto = new ArrayBuffer().__proto__;

    return {
        toString: function (thing) {
            if (typeof thing == 'string') {
                return thing;
            }
            return new dcodeIO.ByteBuffer.wrap(thing).toString('binary');
        },
        toArrayBuffer: function (thing) {
            if (thing === undefined) {
                return undefined;
            }
            if (thing === Object(thing)) {
                if (thing.__proto__ == StaticArrayBufferProto) {
                    return thing;
                }
            }

            let str;
            if (typeof thing == 'string') {
                str = thing;
            } else {
                throw new Error('Tried to convert a non-string of type ' + typeof thing + ' to an array buffer');
            }
            return new dcodeIO.ByteBuffer.wrap(thing, 'binary').toArrayBuffer();
        },
        isEqual: function (a, b) {
            if (a === undefined || b === undefined) {
                return false;
            }
            a = util.toString(a);
            b = util.toString(b);
            let maxLength = Math.max(a.length, b.length);
            if (maxLength < 5) {
                throw new Error('a/b compare too short');
            }
            return a.substring(0, Math.min(maxLength, a.length)) == b.substring(0, Math.min(maxLength, b.length));
        }
    };
})();

export default new Vuex.Store({
    // plugins: [createPersistedState({
    //     reducer: state => ({
    //         deviceId: state.deviceId,
    //         registrationId: state.registrationId,
    //     }),
    // })],
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
        messages: [],
        friends: [],
    },
    mutations: {
        ['commit-account-registration'] (state, {deviceId, registrationId, identityKeyPair, preKey, signedPreKey}) {

            // build a new store on each account
            // when server based this should only happen once
            state.store = new InMemorySignalProtocolStore();

            state.deviceId = parseInt(deviceId);
            state.registrationId = parseInt(registrationId);

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
        ['commit-message'] (state, messageObj) {
            Vue.set(state, 'messages', state.messages.concat(messageObj));
        },
        ['commit-sent-message'] (state, messageObj) {
            let stringifyObj = messageObj;
            stringifyObj.ciphertextMessage = JSON.stringify(messageObj.ciphertextMessage);

            Vue.set(state, 'messages', state.messages.concat(stringifyObj));
        },
        ['commit-friend'] (state, friend) {
            // add if not existing
            if (state.friends.indexOf(friend) === -1) {
                Vue.set(state, 'friends', state.friends.concat(friend));
            }
        },
        ['clear-messages'] (state) {
            Vue.set(state, 'messages', []);
        }
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

            // Every x seconds check if the main account has changed
            setInterval(() => {
                dispatch('poll-message');
            }, 1000);
        },
        async ['send-keys-to-server'] ({commit, dispatch, state, rootState}, form) {
            try {
                console.log(`Sending keys`);

                // NOTE: No private keys go to the server - not sure type is needed?
                let reqObj = {
                    deviceId: parseInt(state.deviceId),
                    registrationId: parseInt(state.registrationId),
                    identityKey: arrayBufferToBase64(state.identityKeyPair.pubKey),
                    signedPreKey: {
                        keyId: parseInt(state.signedPreKey.keyId),
                        publicKey: arrayBufferToBase64(state.signedPreKey.keyPair.pubKey),
                        signature: arrayBufferToBase64(state.signedPreKey.signature)
                    },
                    preKey: {
                        keyId: parseInt(state.preKey.keyId),
                        publicKey: arrayBufferToBase64(state.preKey.keyPair.pubKey)
                    }
                };
                console.log(reqObj);

                const res = await api.put(`/keys`, reqObj);
                console.log(`registered keys`, res);
            } catch (ex) {
                console.error(ex);
            }
        },
        async ['add-friend'] ({commit, dispatch, state, rootState}, form) {
            try {
                const [deviceId, registrationId] = form.id.split('-');
                console.log(`Adding device [${deviceId}] registration [${registrationId}]`);

                const address = new ls.SignalProtocolAddress(registrationId, deviceId);

                // Instantiate a SessionBuilder for a remote recipientId + deviceId tuple.
                // NOTE: requires the SignalProtocolStore to do it's magic
                // PRESUME this only needs to be done once and not on each message
                const sessionBuilder = new ls.SessionBuilder(state.store, address);

                // loads recipient's pre-keys - required to build shared key for encryption
                const preKeyResp = await api.get(`/keys?deviceId=${deviceId}&registrationId=${registrationId}`);

                let keys = preKeyResp.data;

                // map array buffers to base64 strings
                keys.identityKey = base64ToArrayBuffer(keys.identityKey);
                keys.signedPreKey.publicKey = base64ToArrayBuffer(keys.signedPreKey.publicKey);
                keys.signedPreKey.signature = base64ToArrayBuffer(keys.signedPreKey.signature);
                keys.preKey.publicKey = base64ToArrayBuffer(keys.preKey.publicKey);

                console.log(keys);

                // add recipient to session
                await sessionBuilder.processPreKey(keys);

                console.log(`pre key processed`, keys);

                commit('commit-friend', form.id);
            } catch (ex) {
                console.error(ex);
            }
        },
        async ['send-message'] ({commit, dispatch, state, rootState}, form) {
            try {
                const [deviceId, registrationId] = form.id.split('-');
                console.log(`Sending "${form.message}" to device [${deviceId}] registration [${registrationId}]`);

                const address = new ls.SignalProtocolAddress(registrationId, deviceId);

                // encrypt
                const sessionCipher = new ls.SessionCipher(state.store, address);
                const ciphertext = await sessionCipher.encrypt(form.message);

                console.log(ciphertext);

                let msgObj = {
                    destinationDeviceId: parseInt(deviceId),
                    destinationRegistrationId: parseInt(registrationId),
                    deviceId: parseInt(state.deviceId),
                    registrationId: parseInt(state.registrationId),
                    ciphertextMessage: ciphertext
                };

                const res = await api.put(`/messages`, msgObj);
                console.log(`sent message cipher`, res);

                // add message into local store with unencrypted
                msgObj.message = form.message;
                msgObj.timestamp = new Date().getTime();

                commit('commit-sent-message', msgObj);
            } catch (ex) {
                console.error(ex);
            }
        },
        async ['clear-messages'] ({commit, dispatch, state, rootState}) {
            commit('clear-messages');
        },
        async ['poll-message'] ({commit, dispatch, state, rootState}) {
            try {
                console.log(`/messages?deviceId=${state.deviceId}&registrationId=${state.registrationId}`);

                const encryptedMessageData = await api.get(`/messages?deviceId=${state.deviceId}&registrationId=${state.registrationId}`);

                if (encryptedMessageData.status === 200) {
                    const encryptedMessage = encryptedMessageData.data;
                    console.log(encryptedMessage);

                    if (encryptedMessage && encryptedMessage.length > 0) {
                        const message = encryptedMessage[0];

                        const registrationId = message.value.registrationId;
                        const deviceId = message.value.deviceId;

                        console.log(`Received from device [${deviceId}] registraion [${registrationId}]`);

                        let fromAddress = new ls.SignalProtocolAddress(registrationId, deviceId);
                        let sessionCipher = new ls.SessionCipher(state.store, fromAddress);

                        let plaintext;
                        if (message.value.ciphertextMessage.type === 3) {
                            console.log(`TYPE 3: decryptPreKeyWhisperMessage`);
                            plaintext = await sessionCipher.decryptPreKeyWhisperMessage(message.value.ciphertextMessage.body, 'binary');
                            commit('commit-friend', `${deviceId}-${registrationId}`);
                        }
                        else if (message.value.ciphertextMessage.type === 1) {
                            console.log(`TYPE 1: decryptWhisperMessage`);
                            plaintext = await sessionCipher.decryptWhisperMessage(message.value.ciphertextMessage.body, 'binary');
                        }

                        console.log(plaintext);
                        let decryptedMessage = util.toString(plaintext);

                        console.log(decryptedMessage);

                        commit('commit-message', {
                            ...message.value,
                            message: decryptedMessage,
                        });

                        // delete message on receipt
                        await api.delete(`/messages?key=${message.key}`);
                    }
                }
            } catch (ex) {
                console.error(ex);
            }
        }
    },
    getters: {}
});
