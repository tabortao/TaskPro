// 可拖动悬浮按钮组件
import {View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useEffect, useRef, useState} from 'react'

interface FloatingButtonProps {
  icon?: string
  onClick?: () => void
  storageKey?: string
}

export default function FloatingButton({
  icon = 'i-mdi-plus',
  onClick,
  storageKey = 'floating-button-position'
}: FloatingButtonProps) {
  const [position, setPosition] = useState({x: 300, y: 500})
  const [isDragging, setIsDragging] = useState(false)
  const hasMoved = useRef(false)
  const startPos = useRef({x: 0, y: 0})
  const startTouchPos = useRef({x: 0, y: 0})

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
    hasMoved.current = false
    startPos.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    }
    startTouchPos.current = {
      x: touch.clientX,
      y: touch.clientY
    }
  }

  const handleTouchMove = (e: any) => {
    if (!isDragging) return
    const touch = e.touches[0]

    // 计算移动距离
    const moveX = Math.abs(touch.clientX - startTouchPos.current.x)
    const moveY = Math.abs(touch.clientY - startTouchPos.current.y)

    // 如果移动超过 5px，认为是拖动
    if (moveX > 5 || moveY > 5) {
      hasMoved.current = true
    }

    const newX = touch.clientX - startPos.current.x
    const newY = touch.clientY - startPos.current.y
    const {windowWidth, windowHeight} = Taro.getSystemInfoSync()
    const buttonSize = 56
    const boundedX = Math.max(0, Math.min(newX, windowWidth - buttonSize))
    const boundedY = Math.max(0, Math.min(newY, windowHeight - buttonSize))
    setPosition({x: boundedX, y: boundedY})
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    savePosition(position)

    // 如果没有移动，认为是点击
    if (!hasMoved.current) {
      onClick?.()
    }
  }

  return (
    <View
      className="fixed w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center z-40"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transition: isDragging ? 'none' : 'all 0.3s ease',
        cursor: 'move'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}>
      <View className={`${icon} text-3xl text-primary-foreground`} />
    </View>
  )
}
