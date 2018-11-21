<template>
    <div>
        <h1>Messages</h1>

        <h2><span class="badge badge-warning">ID:</span> {{ registrationId }}|{{ deviceId }}</h2>

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

            <b-form @submit="onReceive" v-if="show" inline>

                <!--<b-form-select id="id" required v-model="form.id" :options="friends" class="mb-2 mr-sm-2 mb-sm-0"></b-form-select>-->

                <b-form-input id="id"
                              type="text"
                              v-model="form.id"
                              required
                              class="mb-2 mr-sm-2 mb-sm-0"
                              placeholder="id">
                </b-form-input>

                <b-button type="submit" variant="primary">Receive</b-button>
            </b-form>
        </div>
        <div v-else>
            <b-alert variant="danger" show class="text-center">Not registered!</b-alert>
        </div>

        <h3>Received</h3>
        <div class="row">
            <div v-if="messages && messages.length > 0" class="col">
                <b-table striped hover :items="messages"></b-table>
            </div>
        </div>

        <h3>Sent</h3>
        <div class="row">
            <div v-if="sent && sent.length > 0" class="col">
                <b-table striped hover :items="sent"></b-table>
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
            },
            onReceive (evt) {
                evt.preventDefault();
                // alert(JSON.stringify(this.form));
                this.$store.dispatch('receive-message', this.form)
            }
        }
    };
</script>

<style lang="scss">
    div {
        margin-bottom: 20px;
        margin-top: 20px;
    }
</style>
