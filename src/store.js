import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const ls = window.libsignal;
// const store = new window.SignalProtocolStore();

const KeyHelper = ls.KeyHelper;

export default new Vuex.Store({
    state: {
        accounts: {}
    },
    mutations: {
        ['commit-account-registration'] (state, {name, deviceId, registrationId}) {
            console.log(`Committing Registration ID ${registrationId} for ${deviceId} and ${name}`);
            Vue.set(state.accounts, deviceId, {deviceId: deviceId, registrationId: registrationId, name: name});
        },
    },
    actions: {
        async ['generate-registration-id'] ({commit, dispatch, state, rootState}, form) {
            console.log(`Generating Registration ID for ${JSON.stringify(form)}`);
            commit('commit-account-registration', {...form, registrationId: KeyHelper.generateRegistrationId()});
        },
    },
    getters: {
        generateIdKey: () => {
            return KeyHelper.generateIdentityKeyPair().then(identityKeyPair => {
                console.log(identityKeyPair);
                return identityKeyPair;
            });
        }
    }
});
