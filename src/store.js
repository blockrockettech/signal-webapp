import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
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

const DEFAULT_NUMBER_OF_PRE_KEYS = 50;

// Generate multiple PreKeys (as per documentation)
async function generatePreKeys (registrationId) {
    let listOfPreKeysPromise = [];
    for (let i = 0; i < DEFAULT_NUMBER_OF_PRE_KEYS; i++) {
        listOfPreKeysPromise.push(KeyHelper.generatePreKey(registrationId + i + 1));
    }

    const resolvedPreKeys = await Promise.all(listOfPreKeysPromise);

    const preKeys = resolvedPreKeys.map(preKey => {
        // Create a preKey keyPair, these keys can be stored in the client
        return {
            keyId: preKey.keyId,
            keyPair: preKey.keyPair
        };
    });

    return {
        preKeys
    };
}

export default new Vuex.Store({
    state: {
        // local session vars
        deviceId: null,
        registrationId: null,
        identityKeyPair: null,
        signedPreKey: null,

        // needs to be a SignalProtocolStore impl
        // used to build sessions and handle messages
        // holds pre-keys for other users
        store: null,
        messages: [],
        friends: [],
    },
    mutations: {
        ['commit-account-registration'] (state, {deviceId, registrationId, identityKeyPair, preKeys, signedPreKey}) {

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

            // Store both sets of keys in the client/store
            state.preKeys = preKeys;

            // Store these keys in the client, others will make requests to you for these
            preKeys.forEach(({keyId, keyPair}) => {
                // needs to be in SignalProtocolStore
                state.store.storePreKey(keyId, keyPair);
            });

            state.signedPreKey = signedPreKey;

            // needs to be in SignalProtocolStore
            state.store.storeSignedPreKey(signedPreKey.keyId, signedPreKey.keyPair);
        },
        ['commit-message'] (state, messageObj) {
            Vue.set(state, 'messages', state.messages.concat(messageObj));

            Vue.ls.set('messages', state.messages);
        },
        ['commit-sent-message'] (state, messageObj) {
            let stringifyObj = messageObj;
            stringifyObj.ciphertextMessage = JSON.stringify(messageObj.ciphertextMessage);

            Vue.set(state, 'messages', state.messages.concat(stringifyObj));

            Vue.ls.set('messages', state.messages);
        },
        ['commit-friend'] (state, friend) {
            // add if not existing
            if (state.friends.indexOf(friend) === -1) {
                Vue.set(state, 'friends', state.friends.concat(friend));

                Vue.ls.set('friends', state.friends);
            }
        },
        ['clear-messages'] (state) {
            Vue.set(state, 'messages', []);

            Vue.ls.set('messages', []);
        },
        ['keys-to-local'] (state) {
            // add to local storage
            Vue.ls.set('deviceId', parseInt(state.deviceId));
            Vue.ls.set('registrationId', parseInt(state.registrationId));
            Vue.ls.set('identityKeyPair', {
                pubKey: arrayBufferToBase64(state.identityKeyPair.pubKey),
                privKey: arrayBufferToBase64(state.identityKeyPair.privKey),
            });

            Vue.ls.set('preKeys', state.preKeys.map((preKey) => {
                return {
                    keyId: parseInt(preKey.keyId),
                    keyPair: {
                        pubKey: arrayBufferToBase64(preKey.keyPair.pubKey),
                        privKey: arrayBufferToBase64(preKey.keyPair.privKey),
                    }
                };
            }));

            Vue.ls.set('signedPreKey', {
                keyId: parseInt(state.signedPreKey.keyId),
                keyPair: {
                    pubKey: arrayBufferToBase64(state.signedPreKey.keyPair.pubKey),
                    privKey: arrayBufferToBase64(state.signedPreKey.keyPair.privKey),
                },
                signature: arrayBufferToBase64(state.signedPreKey.signature)
            });
        },
        ['restore-session'] (state) {
            // build a new store on each account
            state.store = new InMemorySignalProtocolStore();

            state.deviceId = Vue.ls.get('deviceId');
            state.registrationId = Vue.ls.get('registrationId');

            // needs to be in SignalProtocolStore
            state.store.put('registrationId', state.registrationId);

            state.identityKeyPair = Vue.ls.get('identityKeyPair');
            state.identityKeyPair.pubKey = base64ToArrayBuffer(state.identityKeyPair.pubKey);
            state.identityKeyPair.privKey = base64ToArrayBuffer(state.identityKeyPair.privKey);

            // needs to be in SignalProtocolStore
            state.store.put('identityKey', state.identityKeyPair);

            // Load and unpack preKeys
            state.preKeys = Vue.ls.get('preKeys').map((rawPreKey) => {
                return {
                    keyId: rawPreKey.keyId,
                    keyPair: {
                        pubKey: base64ToArrayBuffer(rawPreKey.keyPair.pubKey),
                        privKey: base64ToArrayBuffer(rawPreKey.keyPair.privKey),
                    }
                };
            });

            // needs to be in SignalProtocolStore
            state.preKeys.forEach((preKey) => {
                state.store.storePreKey(preKey.keyId, preKey.keyPair);
            });

            state.signedPreKey = Vue.ls.get('signedPreKey');
            state.signedPreKey.keyPair.pubKey = base64ToArrayBuffer(state.signedPreKey.keyPair.pubKey);
            state.signedPreKey.keyPair.privKey = base64ToArrayBuffer(state.signedPreKey.keyPair.privKey);
            state.signedPreKey.signature = base64ToArrayBuffer(state.signedPreKey.signature);

            // needs to be in SignalProtocolStore
            state.store.storeSignedPreKey(state.signedPreKey.keyId, state.signedPreKey.keyPair);

            // messages - ideally this should be somewhere else...
            state.messages = Vue.ls.get('messages');
        }
    },
    actions: {
        // bootstraps a Signal device, registration, and keys
        async ['generate-registration-id'] ({commit, dispatch, state, rootState}, form) {
            console.info(`Generating registration ID for device [${form.deviceId}]`);

            const registrationId = KeyHelper.generateRegistrationId();
            // console.log(registrationId);

            const identityKeyPair = await KeyHelper.generateIdentityKeyPair();
            // console.log(identityKeyPair);

            // Generate X number of preKeys for use in various chat clients
            const {preKeys} = await generatePreKeys(registrationId);

            const signedPreKey = await KeyHelper.generateSignedPreKey(identityKeyPair, registrationId);
            // console.log(signedPreKey);

            commit('commit-account-registration', {
                ...form,
                registrationId: registrationId,
                identityKeyPair: identityKeyPair,
                preKeys,
                signedPreKey: signedPreKey
            });

            dispatch('send-keys-to-server');

            // Every x seconds check if the main account has changed
            setInterval(() => {
                dispatch('poll-message');
            }, 1000);

            console.debug(`Polling for messages for device [${form.deviceId}] registration [${registrationId}]`);

            // add to local storage so we can recreate a session...in theory
            commit('keys-to-local');
        },
        async ['send-keys-to-server'] ({commit, dispatch, state, rootState}) {
            try {
                console.info(`Sending pre-keys for device [${state.deviceId}] registration [${state.registrationId}]`);

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
                    // Generate preKey bundle for others to use, these get sent to the server
                    preKeys: state.preKeys.map((preKey) => {
                        return {
                            keyId: parseInt(preKey.keyId),
                            // Only send public pre key and ID
                            publicKey: arrayBufferToBase64(preKey.keyPair.pubKey)
                        };
                    })
                };

                const res = await api.put(`/keys`, reqObj);
                console.debug(`Registered pre-keys`, res);
            } catch (ex) {
                console.error(ex);
            }
        },
        async ['add-friend'] ({commit, dispatch, state, rootState}, form) {
            try {
                const [deviceId, registrationId] = form.id.split('-');
                console.info(`Adding device [${deviceId}] registration [${registrationId}] to signal protocol store`);

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

                // add recipient to session
                await sessionBuilder.processPreKey(keys);

                console.debug(`Pre keys processed:`, keys);

                commit('commit-friend', form.id);
            } catch (ex) {
                console.error(ex);
            }
        },
        async ['send-message'] ({commit, dispatch, state, rootState}, form) {
            try {
                const [deviceId, registrationId] = form.id.split('-');
                console.info(`Sending "${form.message}" to device [${deviceId}] registration [${registrationId}]`);

                const address = new ls.SignalProtocolAddress(registrationId, deviceId);

                // encrypt
                const sessionCipher = new ls.SessionCipher(state.store, address);
                const ciphertext = await sessionCipher.encrypt(form.message);

                let msgObj = {
                    destinationDeviceId: parseInt(deviceId),
                    destinationRegistrationId: parseInt(registrationId),
                    deviceId: parseInt(state.deviceId),
                    registrationId: parseInt(state.registrationId),
                    ciphertextMessage: ciphertext
                };

                await api.put(`/messages`, msgObj);
                console.debug(`Sent encrypted message cipher:`, msgObj);

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
        async ['restore-session'] ({commit, dispatch, state, rootState}) {
            commit('restore-session');

            // re-add friends
            const friends = Vue.ls.get('friends');
            if (friends && friends.length > 0) {
                friends.forEach((f) => dispatch('add-friend', {id: f}));
            }

            // Every x seconds check if the main account has changed
            setInterval(() => {
                dispatch('poll-message');
            }, 1000);
        },
        async ['poll-message'] ({commit, dispatch, state, rootState}) {
            try {
                // console.log(`/messages?deviceId=${state.deviceId}&registrationId=${state.registrationId}`); // too noisy

                const encryptedMessageData = await api.get(`/messages?deviceId=${state.deviceId}&registrationId=${state.registrationId}`);

                if (encryptedMessageData.status === 200) {
                    const encryptedMessage = encryptedMessageData.data;

                    if (encryptedMessage && encryptedMessage.length > 0) {
                        // FIXME only processing one message at a time!
                        const message = encryptedMessage[0];

                        const registrationId = message.value.registrationId;
                        const deviceId = message.value.deviceId;

                        console.info(`Received message from device [${deviceId}] registration [${registrationId}]`);
                        console.info(`Message from device [${deviceId}] registration [${registrationId}]`, message);

                        let fromAddress = new ls.SignalProtocolAddress(registrationId, deviceId);
                        let sessionCipher = new ls.SessionCipher(state.store, fromAddress);

                        console.debug(`Encrypted message:`, message.value.ciphertextMessage.body);

                        let plaintext;
                        if (message.value.ciphertextMessage.type === 3) {
                            console.debug(`Cipher message type 3: decryptPreKeyWhisperMessage`);
                            plaintext = await sessionCipher.decryptPreKeyWhisperMessage(message.value.ciphertextMessage.body, 'binary');
                            commit('commit-friend', `${deviceId}-${registrationId}`);
                        } else if (message.value.ciphertextMessage.type === 1) {
                            console.debug(`Cipher message type 1: decryptWhisperMessage`);
                            plaintext = await sessionCipher.decryptWhisperMessage(message.value.ciphertextMessage.body, 'binary');
                        }

                        let decryptedMessage = util.toString(plaintext);

                        console.debug(`Decrypted message:`, decryptedMessage);

                        commit('commit-message', {
                            ...message.value,
                            message: decryptedMessage,
                        });

                        // delete message on receipt
                        await api.delete(`/messages?key=${message.key}`);
                        console.debug(`Read receipt sent for key:`, message.key);
                    }
                }
            } catch (ex) {
                console.error(ex);
            }
        }
    },
    getters: {}
});
