import vue from 'eslint-plugin-vue'
import vuetify from 'eslint-plugin-vuetify'

export default [
  ...vue.configs['flat/base'],
  ...vuetify.configs['flat/base'],
]
