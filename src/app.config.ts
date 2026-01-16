const pages = [
  'pages/topics/index',
  'pages/tasks/index',
  'pages/profile/index',
  'pages/login/index',
  'pages/topic-form/index',
  'pages/archived-topics/index',
  'pages/task-detail/index',
  'pages/task-edit/index',
  'pages/profile-edit/index'
]

export default defineAppConfig({
  pages,
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#4A90E2',
    navigationBarTitleText: 'TaskPro',
    navigationBarTextStyle: 'white'
  }
})
