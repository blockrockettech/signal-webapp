<template>
    <div>
        <h1>Register</h1>

        <b-form @submit="onSubmit" v-if="show">
            <b-form-group id="deviceIDGroup"
                          label="Device ID:"
                          label-for="deviceId"
                          description="Public key">
                <b-form-input id="deviceId"
                              type="text"
                              v-model="form.deviceId"
                              required
                              placeholder="">
                </b-form-input>
            </b-form-group>
            <b-form-group id="NameGroup"
                          label="Your Name:"
                          label-for="name">
                <b-form-input id="name"
                              type="text"
                              v-model="form.name"
                              required
                              placeholder="Enter name">
                </b-form-input>
            </b-form-group>
            <b-button type="submit" variant="primary">Submit</b-button>
        </b-form>

        <hr/>
        <code>{{ accounts }}</code>
    </div>
</template>

<script>
    import { mapGetters, mapState } from 'vuex';

    export default {
        name: 'register',
        components: {},
        data () {
            return {
                form: {
                    deviceId: '',
                    name: ''
                },
                show: true
            };
        },
        computed: {
            ...mapState([
                'accounts'
            ])
        },
        methods: {
            onSubmit (evt) {
                evt.preventDefault();
                // alert(JSON.stringify(this.form));
                this.$store.dispatch('generate-registration-id', this.form);
            }
        }
    };
</script>
