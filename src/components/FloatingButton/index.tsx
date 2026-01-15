// 可拖动悬浮按钮组件
import {View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useEffect, useState} from 'react'

interface FloatingButtonProps {
  icon?: string // MDI 图标类名
  onClick?: () => void
  storageKey?: string // 用于持久化位置的 key
}

export default function FloatingButton({
  icon = 'i-mdi-plus',
  onClick,
  storageKey = 'floating-button-position'
}: FloatingButtonProps) {
  const [position, setPosition] = useState({x: 300, y: 500})
  const [isDragging, setIsDragging] = useState(false)
  const [startPos, setStartPos] = useState({x: 0, y: 0})

  // 加载保存的位置
  useEffect(() => {
    try {
      const saved = Taro.getStorageSync(storageKey)
      if (saved) {
        setPosition(JSON.parse(saved))
      }
    } catch (error) {
      console.error('加载悬浮按钮位置失败:', error)
    }
  }, [storageKey])

  // 保存位置
  const savePosition = (pos: {x: number; y: number}) => {
    try {
      Taro.setStorageSync(storageKey, JSON.stringify(pos))
    } catch (error) {
      console.error('保存悬浮按钮位置失败:', error)
    }
  }

  const handleTouchStart = (e: any) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setStartPos({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    })
  }

  const handleTouchMove = (e: any) => {
    if (!isDragging) return

    const touch = e.touches[0]
    const newX = touch.clientX - startPos.x
    const newY = touch.clientY - startPos.y

    // 获取屏幕尺寸
    const {windowWidth, windowHeight} = Taro.getSystemInfoSync()
    const buttonSize = 56 // 按钮大小

    // 限制在屏幕范围内
    const boundedX = Math.max(0, Math.min(newX, windowWidth - buttonSize))
    const boundedY = Math.max(0, Math.min(newY, windowHeight - buttonSize))

    setPosition({x: boundedX, y: boundedY})
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    savePosition(position)
  }

  const handleClick = () => {
    if (!isDragging) {
      onClick?.()
    }
  }

  return (
    <View
      className="fixed w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center z-40"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transition: isDragging ? 'none' : 'all 0.3s ease'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}>
      <View className={`${icon} text-3xl text-primary-foreground`} />
    </View>
  )
}
