<template>
    <div id="messages-page">
        <h1>Chat with <span class="badge badge-primary">{{ $route.params.id }}</span></h1>

        <div v-if="messages && messages.length > 0" id="messages">
            <div v-for="msg in orderBy(filteredMessages, '-timestamp')" :key="msg.timestamp" class="row">
                <div class="col-sm-10">
                    <span v-bind:class="{'them': msg.deviceId !== deviceId}">
                        {{ msg.message }}
                        <span class="text-muted xs">{{ new Date(msg.timestamp).toLocaleTimeString() }}</span>
                    </span>
                    <!--<code>{{ msg.ciphertextMessage }}</code>-->
                </div>
                <div class="col-sm-2">
                    <span class="badge badge-primary" v-if="msg.deviceId !== deviceId">{{ msg.deviceId }}-{{ msg.registrationId }}</span>
                </div>
            </div>
        </div>

        <div v-if="registrationId" class="fixed-bottom m-2">
            <b-form @submit="onSend" v-if="show">
                <div class="row m-0 p-0">
                    <div class="col-11 m-0 p-0">
                        <b-form-input id="message"
                                      type="text"
                                      v-model="form.message"
                                      required
                                      class="w-100"
                                      placeholder="Message">
                        </b-form-input>
                    </div>
                    <div class="col-1 m-0 p-0">
                        <b-button type="submit" variant="primary" class="ml-2">Send</b-button>
                    </div>
                </div>
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
                    id: this.$route.params.id,
                    message: ''
                },
                show: true
            };
        },
        computed: {
            ...mapState([
                'registrationId', 'deviceId', 'messages',
            ]),
            filteredMessages: function() {
                if (!this.messages) return;

                let that = this;
                return this.messages.filter(function (msg) {
                    const destinationDeviceId =  parseInt(that.$route.params.id.split('-')[0]);
                    return (msg.deviceId === that.deviceId && msg.destinationDeviceId === destinationDeviceId) || msg.deviceId === destinationDeviceId;
                })
            }
        },
        methods: {
            onSend (evt) {
                evt.preventDefault();
                // alert(JSON.stringify(this.form));
                this.$store.dispatch('send-message', this.form)
                    .then(() => {
                        this.form.message = '';
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
