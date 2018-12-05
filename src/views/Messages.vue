<template>
    <div id="messages-page">
        <h1>Chat with <span class="badge badge-primary">{{ $route.params.id }}</span></h1>

        <div v-if="messages && messages.length > 0" id="messages">
            <div v-for="msg in orderBy(filteredMessages, '-timestamp')" :key="msg.timestamp" class="row">
                <div class="col-sm-12">
                    <span v-bind:class="{'them': msg.deviceId !== deviceId}" class="">
                        <span class="p-1 m-3 pl-3 pr-3" v-bind:class="{'speech-bubble-left': msg.deviceId !== deviceId, 'speech-bubble-right': msg.deviceId === deviceId}">
                            {{ msg.message }}
                        </span>
                        <span class="text-muted xs">
                            {{ new Date(msg.timestamp).toLocaleTimeString() }}
                            <!--<code class="" v-if="msg.deviceId !== deviceId">{{ msg.deviceId }}-{{ msg.registrationId }}</code>-->
                        </span>
                    </span>
                    <!--<code>{{ msg.ciphertextMessage }}</code>-->
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
            filteredMessages: function () {
                if (!this.messages) return;

                let that = this;
                return this.messages.filter(function (msg) {
                    const destinationDeviceId = parseInt(that.$route.params.id.split('-')[0]);
                    return (msg.deviceId === that.deviceId && msg.destinationDeviceId === destinationDeviceId) || msg.deviceId === destinationDeviceId;
                });
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
    $left: #BCED91;
    $right: #D3D3D3;

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
            font-size: 0.6rem;
            margin-left: 5px;
        }

        .speech-bubble-left {
            position: relative;
            background: $left;
            border-radius: .4em;
        }

        .speech-bubble-left:after {
            content: '';
            position: absolute;
            right: 0;
            top: 50%;
            width: 0;
            height: 0;
            border: 0.625em solid transparent;
            border-left-color: $left;
            border-right: 0;
            border-bottom: 0;
            margin-top: -0.312em;
            margin-right: -0.625em;
        }

        .speech-bubble-right {
            position: relative;
            background: $right;
            border-radius: .4em;
        }

        .speech-bubble-right:after {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            width: 0;
            height: 0;
            border: 0.625em solid transparent;
            border-right-color: $right;
            border-left: 0;
            border-bottom: 0;
            margin-top: -0.312em;
            margin-left: -0.625em;
        }
    }
</style>
