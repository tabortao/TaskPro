import Taro from '@tarojs/taro'
import {useEffect} from 'react'

// Auto-fix blank page issue caused by missing tabBar page class name during hot reload
export const useTabBarPageClass = () => {
  useEffect(() => {
    // Only listen to route changes in Web environment
    if (Taro.getEnv() !== Taro.ENV_TYPE.WEB) return

    const handleTabSwitch = ({toLocation}) => {
      try {
        const route = toLocation?.path
        const isTabBarPage = Taro.getApp().config?.tabBar?.list?.some((tab) => tab.pagePath === route)
        // Add class name to tabBar pages during route switching
        if (isTabBarPage) {
          document.querySelector(`#app > [id*="${route}"]`)?.classList.add('taro_tabbar_page')
        }
      } catch (error) {
        console.error('error in tab switch handler:', error)
      }
    }

    Taro.eventCenter.on('__taroRouterChange', handleTabSwitch)

    return () => {
      Taro.eventCenter.off('__taroRouterChange', handleTabSwitch)
    }
  }, [])
}
