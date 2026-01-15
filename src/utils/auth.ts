import Taro from '@tarojs/taro'
import {supabase} from '@/client/supabase'

// 白名单路由（不需要登录即可访问）
const WHITELIST_ROUTES = ['/pages/login/index']

// 检查用户是否已登录
export async function checkAuth() {
  try {
    const {
      data: {session}
    } = await supabase.auth.getSession()
    return !!session
  } catch (error) {
    console.error('检查登录状态失败:', error)
    return false
  }
}

// 获取当前用户ID
export async function getCurrentUserId() {
  try {
    const {
      data: {session}
    } = await supabase.auth.getSession()
    return session?.user?.id || null
  } catch (error) {
    console.error('获取用户ID失败:', error)
    return null
  }
}

// 路由守卫
export async function authGuard(currentPath: string) {
  // 检查是否在白名单中
  if (WHITELIST_ROUTES.some((route) => currentPath.startsWith(route))) {
    return true
  }

  // 检查是否已登录
  const isAuthenticated = await checkAuth()

  if (!isAuthenticated) {
    // 保存当前路径，登录后跳转回来
    Taro.setStorageSync('loginRedirectPath', currentPath)

    // 跳转到登录页
    Taro.redirectTo({url: '/pages/login/index'})
    return false
  }

  return true
}

// 登录后重定向
export function redirectAfterLogin() {
  const redirectPath = Taro.getStorageSync('loginRedirectPath')
  Taro.removeStorageSync('loginRedirectPath')

  if (redirectPath) {
    // 检查是否是 tabBar 页面
    const tabBarPages = ['/pages/topics/index', '/pages/profile/index']

    if (tabBarPages.includes(redirectPath)) {
      Taro.switchTab({url: redirectPath})
    } else {
      Taro.navigateTo({url: redirectPath})
    }
  } else {
    // 默认跳转到话题列表页
    Taro.switchTab({url: '/pages/topics/index'})
  }
}

// 登出
export async function logout() {
  try {
    await supabase.auth.signOut()
    Taro.clearStorageSync()
    Taro.redirectTo({url: '/pages/login/index'})
  } catch (error) {
    console.error('登出失败:', error)
    Taro.showToast({title: '登出失败', icon: 'none'})
  }
}
