<template>
    <div>
        <h1>Friends</h1>

        <div class="row">
            <div v-if="friends && friends.length > 0" class="col">
                <ul>
                    <li v-for="friend in friends" v-bind:key="friend"><span class="badge badge-primary">{{ friend }}</span></li>
                </ul>
            </div>
        </div>

        <div v-if="registrationId" class="fixed-bottom m-3">
            <b-form @submit="onSubmit" v-if="show" inline>

                <b-form-input id="id"
                              type="text"
                              v-model="form.id"
                              required
                              class="mb-2 mr-sm-2 mb-sm-0"
                              placeholder="">
                </b-form-input>

                <b-button type="submit" variant="primary">Add Friend</b-button>
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
                'registrationId', 'deviceId', 'store', 'friends'
            ]),

        },
        methods: {
            onSubmit (evt) {
                evt.preventDefault();
                // alert(JSON.stringify(this.form));
                this.$store.dispatch('add-friend', this.form);
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
