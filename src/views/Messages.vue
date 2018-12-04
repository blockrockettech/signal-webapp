<template>
    <div id="messages-page">
        <h1>Messages</h1>

        <div v-if="messages && messages.length > 0" id="messages">
            <div v-for="msg in orderBy(messages, '-timestamp')" :key="msg.timestamp" class="row">
                <!--{{ msg }}-->
                <div class="col-sm-10">
                    <span v-bind:class="{'them': msg.deviceId !== deviceId}">
                        {{ msg.message }}
                        <span class="text-muted xs">{{ new Date(msg.timestamp).toLocaleTimeString() }}</span>
                    </span>
                    <!--<code>{{ msg.ciphertextMessage }}</code>-->
                </div>
                <div class="col-sm-2">
                    <span class="badge badge-success" v-if="msg.deviceId !== deviceId">{{ msg.deviceId }}-{{ msg.registrationId }}</span>
                </div>
            </div>
        </div>

        <div v-if="registrationId" class="fixed-bottom m-3">
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
                this.$store.dispatch('send-message', this.form)
                    .then(() => {
                        this.form.message = '';
                        this.form.id = this.friends ? this.friends[0] : null;
                    });
            }
        }
    };
</script>

<style lang="scss">
    div {
        margin-bottom: 20px;
        margin-top: 20px;
    }

    #messages-page {
        margin-bottom: 100px;
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

        .xs {
            font-size: 0.5rem;
            margin-left: 5px;
        }
    }
</style>
