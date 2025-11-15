import { Monitor, Moon, Sun } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

type Theme = 'light' | 'dark' | 'system'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  return (localStorage.getItem('theme') as Theme) || 'system'
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const applyTheme = useCallback((newTheme: Theme) => {
    let isDark: boolean

    if (newTheme === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    } else {
      isDark = newTheme === 'dark'
    }

    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  useEffect(() => {
    // Check for saved theme preference or default to system
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'system'

    setTheme(savedTheme)
    applyTheme(savedTheme)

    // Listen for system theme changes when in system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const currentTheme = localStorage.getItem('theme') as Theme
      if (currentTheme === 'system' || !currentTheme) {
        applyTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [applyTheme])

  const cycleTheme = () => {
    const themeOrder: Theme[] = ['system', 'light', 'dark']
    const currentIndex = themeOrder.indexOf(theme)
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length]

    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
    applyTheme(nextTheme)
  }

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="size-5" />
      case 'dark':
        return <Moon className="size-5" />
      case 'system':
        return <Monitor className="size-5" />
    }
  }

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Switch to dark mode'
      case 'dark':
        return 'Switch to system mode'
      case 'system':
        return 'Switch to light mode'
    }
  }

  return (
    <Button
      suppressHydrationWarning
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      aria-label={getLabel()}
      title={`Current theme: ${theme}`}
    >
      {mounted && getIcon()}
    </Button>
  )
}
