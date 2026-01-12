import type {UserConfigExport} from '@tarojs/cli'
import {injectedGuiListenerPlugin, injectOnErrorPlugin, makeTagger, monitorPlugin} from 'miaoda-sc-plugin'

export default (
  sentryDsn?: string,
  environment?: string,
  appId?: string,
  cdnHost?: string
): UserConfigExport<'vite'> => ({
  mini: {
    debugReact: true
  },
  h5: {},
  compiler: {
    type: 'vite',
    vitePlugins: [
      makeTagger({
        root: process.cwd()
      }),
      injectedGuiListenerPlugin({
        path: 'https://resource-static.cdn.bcebos.com/common/v2/injected.js'
      }),
      injectOnErrorPlugin(),
      monitorPlugin({
        scriptSrc: `https://${cdnHost}/sentry/browser.sentry.min.js`,
        sentryDsn: sentryDsn || '',
        environment: environment || '',
        appId: appId || ''
      })
    ]
  }
})
