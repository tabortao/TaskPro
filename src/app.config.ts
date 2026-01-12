const pages = ['pages/home/index', 'pages/login/index']

//  To fully leverage TypeScript's type safety and ensure its correctness, always enclose the configuration object within the global defineAppConfig helper function.
export default defineAppConfig({
  pages,
  tabBar: {
    // at least two items are required
    list: [
      {
        pagePath: 'pages/home/index',
        text: 'Home'
      }
      // {
      //     pagePath: 'pages/welcome/index',
      //     text: 'welcome'
      // }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'WeChat',
    navigationBarTextStyle: 'black'
  }
})
