<template>
    <div>
        <h1>Friends</h1>

        <div class="row">
            <div v-if="friends && friends.length > 0" class="col">
                <ul>
                    <li v-for="friend in friends" v-bind:key="friend">
                        <router-link :to="{ name: 'messages', params: { id: friend } }">
                            <span class="badge badge-primary">{{ friend }}</span>
                        </router-link>
                        <router-link :to="{ name: 'messages', params: { id: friend } }" class="ml-3">Chat</router-link>
                        <span class="badge badge-secondary ml-3">{{ count(friend) }}</span>
                    </li>
                </ul>
            </div>
        </div>

        <div v-if="registrationId" class="fixed-bottom m-2">
            <b-form @submit="onSubmit" v-if="show">
                <div class="row m-0 p-0">
                    <div class="col-11 m-0 p-0">
                        <b-form-input id="id"
                                      type="text"
                                      v-model="form.id"
                                      required
                                      class="w-100"
                                      placeholder="XXX-XXX">
                        </b-form-input>
                    </div>
                    <div class="col-1 m-0 p-0">
                        <b-button type="submit" variant="primary" class="ml-2">Add</b-button>
                    </div>
                </div>
            </b-form>
        </div>
    </div>
</template>

<script>
    import { mapGetters, mapState } from 'vuex';

    export default {
        name: 'friends',
        components: {},
        data () {
            return {
                form: {
                    id: ''
                },
                show: true
            };
        },
        computed: {
            ...mapState([
                'registrationId', 'deviceId', 'store', 'friends', 'messages'
            ])
        },
        methods: {
            onSubmit (evt) {
                evt.preventDefault();
                // alert(JSON.stringify(this.form));
                this.$store.dispatch('add-friend', this.form);
            },
            count (friendDeviceId) {
                if (!this.messages) return;

                return this.messages.filter(function (msg) {
                    const destinationDeviceId =  parseInt(friendDeviceId.split('-')[0]);
                    return msg.deviceId === destinationDeviceId;
                }).length
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
