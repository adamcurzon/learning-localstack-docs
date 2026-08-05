import {theme, useOpenapi} from 'vitepress-openapi/client'
import DefaultTheme from 'vitepress/theme'
import spec from '../../public/openapi.json' with {type: 'json'}
import 'vitepress-openapi/dist/style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({app}) {
    useOpenapi({spec})
    theme.enhanceApp({app})
  },
}
