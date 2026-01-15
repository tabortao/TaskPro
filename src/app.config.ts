const pages = [
  'pages/topics/index',
  'pages/tasks/index',
  'pages/profile/index',
  'pages/login/index',
  'pages/topic-form/index',
  'pages/archived-topics/index',
  'pages/task-detail/index',
  'pages/profile-edit/index'
]

export default defineAppConfig({
  pages,
  tabBar: {
    color: '#8B9DC3',
    selectedColor: '#4A90E2',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/topics/index',
        text: '话题',
        iconPath: './assets/images/unselected/topics.png',
        selectedIconPath: './assets/images/selected/topics.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: './assets/images/unselected/profile.png',
        selectedIconPath: './assets/images/selected/profile.png'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#4A90E2',
    navigationBarTitleText: 'TaskPro',
    navigationBarTextStyle: 'white'
  }
})
