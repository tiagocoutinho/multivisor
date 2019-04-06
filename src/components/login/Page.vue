<template>
   <v-container fluid grid-list-md>
     <v-form v-model="valid">
        <v-layout align-center justify-center>
          <v-flex xs12 sm6 md5 lg4 xl3>
            <v-card class="elevation-12">
              <v-toolbar dark color="primary">
                <v-toolbar-title>Log in</v-toolbar-title>
              </v-toolbar>
              <v-card-text>
                <input type="text" :model="username">
                <p :bind="username"></p>
                <v-form>
                  <v-text-field autofocus prepend-icon="person" name="username" label="Username" type="text"
                                v-model="username" :rules="[rules.required]"></v-text-field>
                  <v-text-field prepend-icon="lock" name="password" label="Password" type="password"
                                v-model="password" :rules="[rules.required]"></v-text-field>
                </v-form>
              </v-card-text>
              <v-card-actions align="center">
                <v-layout justify-center>
                  <v-btn color="primary" bottom @click="submit">Log in</v-btn>
                </v-layout>
              </v-card-actions>
            </v-card>
          </v-flex>
        </v-layout>
       </v-form>
      </v-container>
</template>

<script>
export default {
  name: 'LoginPage',
  data: () => {
    return {
      'valid': false,
      'username': '',
      'password': '',
      'rules': {
        'required': value => !!value || 'This field is required'
      }
    }
  },
  methods: {
    submit () {
      const form = new FormData()
      form.append('username', this.username)
      form.append('password', this.password)
      fetch('/api/login', {method: 'POST', body: form})
        .then(response => response.json())
        .catch(response => {
          console.log('error!, invalid!')
        })
    }
  }
}
</script>
