<template>
    <div>
        <h1>Messages</h1>

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
            <b-form @submit="onSend" v-if="show" inline>

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


        <div v-if="messages && messages.length > 0" id="messages">
            <div v-for="msg in orderBy(messages, 'timestamp')" :key="msg.timestamp" class="row">
                <div class="col-sm-2 text-muted small">
                    {{ new Date(msg.timestamp).toLocaleTimeString() }}
                </div>
                <div class="col-sm-8">
                    <span v-bind:class="{'them': msg.messageFrom !== `${registrationId}|${deviceId}`}">{{ msg.message }}</span>
                    <code>{{ msg.ciphertextMessage }}</code>
                </div>
                <div class="col-sm-2 text-muted float-right">
                    <span class="badge badge-success" v-if="msg.messageFrom !== `${registrationId}|${deviceId}`">{{ msg.messageFrom }}</span>
                </div>
            </div>
        </div>

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
                'registrationId', 'deviceId', 'store', 'sent', 'messages', 'friends'
            ]),

        },
        methods: {
            onSend (evt) {
                evt.preventDefault();
                // alert(JSON.stringify(this.form));
                this.$store.dispatch('send-message', this.form);
            }
        }
    };
</script>

<style lang="scss">
    div {
        margin-bottom: 20px;
        margin-top: 20px;
    }

    #messages {
        div {
            margin-bottom: 3px;
            margin-top: 3px;
        }

        code {
            font-size: 0.5rem;
            margin-right: 10px;
            margin-left: 10px;
        }

        .them {
            float: right;
        }
    }
</style>
