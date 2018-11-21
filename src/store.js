import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
import {InMemorySignalProtocolStore} from './InMemorySignalProtocolStore';

import _ from 'lowdash';

Vue.use(Vuex);

// core signal lib - added to window from index.html IMPROVE?
const ls = window.libsignal;
const KeyHelper = ls.KeyHelper;

const API_URL = "http://localhost:3000";

const api = axios.create({
    baseURL: `${API_URL}/api/`,
});

const arrayBufferToBase64 = (buffer) =>{
    let binary = '';
    let bytes = new Uint8Array(buffer);
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa(binary);
};

const base64ToArrayBuffer = (base64) => {
    let binary_string =  window.atob(base64);
    let len = binary_string.length;
    let bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
};

// Util import from src/helpers.js
var util = (function() {
    'use strict';

    var StaticArrayBufferProto = new ArrayBuffer().__proto__;

    return {
        toString: function(thing) {
            if (typeof thing == 'string') {
                return thing;
            }
            return new dcodeIO.ByteBuffer.wrap(thing).toString('binary');
        },
        toArrayBuffer: function(thing) {
            if (thing === undefined) {
                return undefined;
            }
            if (thing === Object(thing)) {
                if (thing.__proto__ == StaticArrayBufferProto) {
                    return thing;
                }
            }

            var str;
            if (typeof thing == "string") {
                str = thing;
            } else {
                throw new Error("Tried to convert a non-string of type " + typeof thing + " to an array buffer");
            }
            return new dcodeIO.ByteBuffer.wrap(thing, 'binary').toArrayBuffer();
        },
        isEqual: function(a, b) {
            // TODO: Special-case arraybuffers, etc
            if (a === undefined || b === undefined) {
                return false;
            }
            a = util.toString(a);
            b = util.toString(b);
            var maxLength = Math.max(a.length, b.length);
            if (maxLength < 5) {
                throw new Error("a/b compare too short");
            }
            return a.substring(0, Math.min(maxLength, a.length)) == b.substring(0, Math.min(maxLength, b.length));
        }
    };
})();

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
        ['commit-account-registration'](state, {deviceId, registrationId, identityKeyPair, preKey, signedPreKey}) {

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
        ['commit-message'](state, {id, ciphertext}) {
            console.log(`incoming message for ${id}: ${ciphertext}`);

            Vue.set(state.messages, `${id}`, ciphertext);
        },
    },
    actions: {
        // bootstraps a Signal device, registration, and keys
        async ['generate-registration-id']({commit, dispatch, state, rootState}, form) {
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
        async ['send-keys-to-server']({commit, dispatch, state, rootState}, form) {
            console.log(`Sending keys`);
            // NOTE: No private keys go to the server - not sure type is needed?
            let reqObj = {
                type: 'init',
                deviceId: state.deviceId,
                registrationId: state.registrationId,
                identityKey: arrayBufferToBase64(state.identityKeyPair.pubKey),
                signedPreKey: {
                    keyId: state.signedPreKey.keyId,
                    publicKey: arrayBufferToBase64(state.signedPreKey.keyPair.pubKey),
                    signature: arrayBufferToBase64(state.signedPreKey.signature)
                },
                preKey: {
                    keyId: state.preKey.keyId,
                    publicKey: arrayBufferToBase64(state.preKey.keyPair.pubKey)
                }
            };
            console.log(reqObj);

            return api.post(`/keys/register`, reqObj).then((res) => console.log(`registered keys`, res));
        },
        async ['send-message']({commit, dispatch, state, rootState}, form) {
            const [registrationId, deviceId] = form.id.split('|');

            console.log(`Sending "${form.message}" to ${registrationId}|${deviceId}`);

            try {
                const address = new ls.SignalProtocolAddress(registrationId, deviceId);

                // Instantiate a SessionBuilder for a remote recipientId + deviceId tuple.
                // NOTE: requires the SignalProtocolStore to do it's magic
                // PRESUME this only needs to be done once and not on each message
                const sessionBuilder = new ls.SessionBuilder(state.store, address);

                // loads recipient's pre-keys - required to build shared key for encryption
                const preKeyResp = await api.post(`/keys/lookup`, {registrationId, deviceId});

                let keys = preKeyResp.data;

                keys.identityKey = base64ToArrayBuffer(keys.identityKey);

                keys.signedPreKey.publicKey = base64ToArrayBuffer(keys.signedPreKey.publicKey);
                keys.signedPreKey.signature = base64ToArrayBuffer(keys.signedPreKey.signature);

                keys.preKey.publicKey  = base64ToArrayBuffer(keys.preKey.publicKey);

                console.log(keys);

                // add recipient to session
                await sessionBuilder.processPreKey(keys);

                console.log(`pre key processed`);

                // encrypt
                const sessionCipher = new ls.SessionCipher(state.store, address);
                const ciphertext = await sessionCipher.encrypt(form.message);

                console.log(ciphertext);

                let msgObj = {
                    messageTo: form.id,
                    messageFrom: `${state.registrationId}|${state.deviceId}`,
                    ciphertextMessage: ciphertext,
                };

                // commit('commit-message', {id: form.id, ciphertext: ciphertext});

                return api.post(`/send/message`, msgObj).then((res) => console.log(`sent message cipher`, res));

            } catch (ex) {
                console.error(ex);
            }
        },
        async ['receive-message']({commit, dispatch, state, rootState}, form) {
            console.log(`Receiving from ${state.registrationId}|${state.deviceId}`);

            let requestObject = {
                messageTo: `${state.registrationId}|${state.deviceId}`,
                messageFrom: `${form.id}`
            };
            const encryptedMessageData = await api.post(`/get/message`, requestObject);

            const encryptedMessage = encryptedMessageData.data;
            console.log(encryptedMessage);

            const [registrationId, deviceId] = form.id.split('|');
            let fromAddress = new ls.SignalProtocolAddress(registrationId, deviceId);

            let sessionCipher = new ls.SessionCipher(state.store, fromAddress);

            const plaintext = await sessionCipher.decryptPreKeyWhisperMessage(encryptedMessage.ciphertextMessage.body, 'binary');

            console.log(plaintext);

            let decryptedMessage = util.toString(plaintext);

            console.log(decryptedMessage);
        }
    },
    getters: {}
});
