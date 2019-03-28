<template>
   <v-container fluid grid-list-md>
        <v-layout align-center justify-center>
          <v-flex xs12 sm6 md5 lg4 xl3>
            <v-card class="elevation-12">
              <v-toolbar dark color="primary">
                <v-toolbar-title>Log in</v-toolbar-title>
              </v-toolbar>
              <v-card-text>
                <v-form>
                  <v-text-field autofocus prepend-icon="person" name="login" label="Username" type="text"
                                :model="login" ref="login"></v-text-field>
                  <v-text-field prepend-icon="lock" name="password" label="Password" type="password"
                                :model="password"></v-text-field>
                </v-form>
              </v-card-text>
              <v-card-actions align="center">
                <v-layout justify-center>
                  <v-btn color="primary" bottom>Log in</v-btn>
                </v-layout>
              </v-card-actions>
            </v-card>
          </v-flex>
        </v-layout>
      </v-container>
</template>

<script>
export default {
  name: 'LoginPage',
  data: () => {
    return {
      'login': '',
      'password': ''
    }
  }
}
</script>
