<template>
    <div id="container" class="container">
        <div class="row" v-if="!restoring">
            <div class="col-sm-4 offset-sm-4 text-center">
                <img src="../assets/odin-Hires-icon.png" style="height: 100px;" class="mb-5"/>
                <b-form @submit="onSubmit">
                    <b-form-input id="deviceId"
                                  type="text"
                                  v-model="form.deviceId"
                                  required
                                  class="mb-2 mr-sm-2 mb-sm-0"
                                  placeholder="Odin Public Key">
                    </b-form-input>

                    <b-button type="submit" variant="primary" class="mt-3" :disabled="disabled">Sign in</b-button>
                </b-form>
            </div>
        </div>
        <div class="row mt-5" v-if="restoring">
            <div class="col text-center">
                <code>Restoring session...</code>
            </div>
        </div>
    </div>
</template>

<script>
    import { mapGetters, mapState } from 'vuex';

    export default {
        name: 'sign-in',
        components: {},
        data () {
            return {
                form: {
                    deviceId: ''
                },
                disabled: false,
                restoring: false,
            };
        },
        computed: {
            ...mapState(['registrationId']),
        },
        methods: {
            onSubmit (evt) {
                evt.preventDefault();
                this.disabled = true;
                // alert(JSON.stringify(this.form));
                this.$store.dispatch('generate-registration-id', this.form)
                    .then(() => this.$store.dispatch('clear-messages'))
                    .then(() => this.$router.push('/account'))
                    .catch((ex) => {
                        console.log(ex);
                    });
            }
        },
        mounted() {
            this.$nextTick(() => {
                if (this.$ls.get('deviceId') && this.$ls.get('registrationId')) {
                    console.log(`Restoring keys from local storage for device [${this.$ls.get('deviceId')}]`);
                    this.restoring = true;

                    this.$store.dispatch('restore-session', this.form)
                        .then(() => this.$router.push('/account'))
                        .catch((ex) => {
                            console.log(ex);
                        });
                }
            });
        },
    };
</script>

<style lang="scss">
    div {
        margin-bottom: 20px;
        margin-top: 20px;
    }
</style>
