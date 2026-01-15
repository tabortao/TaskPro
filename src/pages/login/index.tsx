import {Button, Input, Text, View} from '@tarojs/components'
import Taro, {getEnv, useLoad} from '@tarojs/taro'
import {useState} from 'react'
import {supabase} from '@/client/supabase'
import {redirectAfterLogin} from '@/utils/auth'
import './index.scss'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)

  useLoad(() => {
    console.log('登录页加载')
  })

  // 用户名密码登录
  const handleUsernameLogin = async () => {
    if (!agreed) {
      Taro.showToast({title: '请先同意用户协议和隐私政策', icon: 'none'})
      return
    }

    if (!username.trim() || !password.trim()) {
      Taro.showToast({title: '请输入用户名和密码', icon: 'none'})
      return
    }

    // 验证用户名格式（只允许字母、数字和下划线）
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      Taro.showToast({title: '用户名只能包含字母、数字和下划线', icon: 'none'})
      return
    }

    // 验证密码格式（至少6位，包含字母和数字）
    if (password.length < 6 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      Taro.showToast({title: '密码至少6位，需包含字母和数字', icon: 'none'})
      return
    }

    setLoading(true)

    try {
      const email = `${username}@miaoda.com`

      // 先尝试登录
      const {data: signInData, error: signInError} = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        // 如果登录失败，尝试注册
        if (signInError.message.includes('Invalid login credentials')) {
          const {error: signUpError} = await supabase.auth.signUp({
            email,
            password
          })

          if (signUpError) {
            throw signUpError
          }

          Taro.showToast({title: '注册成功，请登录', icon: 'success'})

          // 注册成功后自动登录
          const {error: autoSignInError} = await supabase.auth.signInWithPassword({
            email,
            password
          })

          if (autoSignInError) {
            throw autoSignInError
          }
        } else {
          throw signInError
        }
      }

      Taro.showToast({title: '登录成功', icon: 'success'})

      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        redirectAfterLogin()
      }, 500)
    } catch (error: any) {
      console.error('登录失败:', error)
      Taro.showToast({title: error.message || '登录失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  // 微信授权登录
  const handleWechatLogin = async () => {
    if (!agreed) {
      Taro.showToast({title: '请先同意用户协议和隐私政策', icon: 'none'})
      return
    }

    if (getEnv() !== Taro.ENV_TYPE.WEAPP) {
      Taro.showToast({title: '微信授权登录请在小程序体验，网页端请使用用户名密码登录', icon: 'none'})
      return
    }

    setLoading(true)

    try {
      const loginResult = await Taro.login()

      const {data, error} = await supabase.functions.invoke('wechat-miniprogram-login', {
        body: {code: loginResult?.code}
      })

      if (error) {
        const errorMsg = (await error?.context?.text?.()) || error.message
        throw new Error(errorMsg)
      }

      const {data: session, error: verifyError} = await supabase.auth.verifyOtp({
        token_hash: data.token,
        type: 'email'
      })

      if (verifyError) {
        throw verifyError
      }

      Taro.showToast({title: '登录成功', icon: 'success'})

      setTimeout(() => {
        redirectAfterLogin()
      }, 500)
    } catch (error: any) {
      console.error('微信登录失败:', error)
      Taro.showToast({title: error.message || '微信登录失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="min-h-screen bg-gradient-subtle flex flex-col">
      <View className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Logo 和标题 */}
        <View className="mb-12 flex flex-col items-center">
          <View className="i-mdi-checkbox-multiple-marked-outline text-8xl text-primary mb-4" />
          <Text className="text-4xl font-bold gradient-text">TaskPro</Text>
          <Text className="text-base text-muted-foreground mt-2">高效任务管理工具</Text>
        </View>

        {/* 登录表单 */}
        <View className="w-full max-w-sm">
          <View className="bg-card rounded-xl p-6 shadow-lg mb-4">
            <Text className="text-lg font-semibold text-foreground mb-4">用户名密码登录</Text>

            <View className="mb-4">
              <View className="bg-input rounded-lg border border-border px-4 py-3">
                <Input
                  className="w-full text-foreground"
                  style={{padding: 0, border: 'none', background: 'transparent'}}
                  placeholder="请输入用户名"
                  value={username}
                  onInput={(e) => setUsername(e.detail.value)}
                  disabled={loading}
                />
              </View>
            </View>

            <View className="mb-6">
              <View className="bg-input rounded-lg border border-border px-4 py-3">
                <Input
                  className="w-full text-foreground"
                  style={{padding: 0, border: 'none', background: 'transparent'}}
                  password
                  placeholder="请输入密码（至少6位，含字母和数字）"
                  value={password}
                  onInput={(e) => setPassword(e.detail.value)}
                  disabled={loading}
                />
              </View>
            </View>

            <Button
              className="w-full bg-primary text-white py-4 rounded-lg break-keep text-base"
              size="default"
              onClick={loading ? undefined : handleUsernameLogin}>
              {loading ? '登录中...' : '登录 / 注册'}
            </Button>
          </View>

          {/* 微信登录 */}
          <View className="bg-card rounded-xl p-6 shadow-lg mb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">微信授权登录</Text>
            <Button
              className="w-full bg-secondary text-secondary-foreground py-4 rounded-lg break-keep text-base"
              size="default"
              onClick={loading ? undefined : handleWechatLogin}>
              <View className="flex items-center justify-center">
                <View className="i-mdi-wechat text-xl mr-2" />
                <Text>微信快捷登录</Text>
              </View>
            </Button>
          </View>

          {/* 用户协议 */}
          <View className="flex items-center justify-center gap-2 px-4" onClick={() => setAgreed(!agreed)}>
            <View
              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${agreed ? 'bg-primary border-primary' : 'border-border'}`}>
              {agreed && <View className="i-mdi-check text-white text-sm" />}
            </View>
            <Text className="text-sm text-muted-foreground">我已阅读并同意《用户协议》和《隐私政策》</Text>
          </View>
        </View>
      </View>

      {/* 底部提示 */}
      <View className="pb-8 text-center">
        <Text className="text-xs text-muted-foreground">首次登录将自动注册账号</Text>
      </View>
    </View>
  )
}
