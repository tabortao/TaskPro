import type {UserConfigExport} from '@tarojs/cli'

export default {
  terser: {
    enable: false
  },
  csso: {
    enable: false
  }
} satisfies UserConfigExport<'vite'>
