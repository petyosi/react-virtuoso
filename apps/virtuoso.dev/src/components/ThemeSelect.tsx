import { Half2Icon, MoonIcon, SunIcon } from '@radix-ui/react-icons'
import { useEffect, useState } from 'react'

type Theme = 'auto' | 'dark' | 'light'

const STORAGE_KEY = 'starlight-theme'
const THEMES: Theme[] = ['auto', 'dark', 'light']

function loadTheme(): Theme {
  const stored = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)
  return stored === 'auto' || stored === 'dark' || stored === 'light' ? stored : 'auto'
}

function applyTheme(theme: Theme): void {
  const resolved = theme === 'auto' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : theme
  document.documentElement.dataset.theme = resolved
}

export function ThemeSelect() {
  const [theme, setTheme] = useState<Theme>('auto')

  useEffect(() => {
    const initialTheme = loadTheme()
    setTheme(initialTheme)
    applyTheme(initialTheme)

    const mediaQuery = matchMedia('(prefers-color-scheme: light)')
    const handleChange = () => {
      if (loadTheme() === 'auto') {
        applyTheme('auto')
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  const handleClick = () => {
    const nextTheme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]
    setTheme(nextTheme)
    applyTheme(nextTheme)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, nextTheme === 'light' || nextTheme === 'dark' ? nextTheme : '')
    }
  }

  return (
    <button
      aria-label="Select theme"
      className={`
        flex cursor-pointer items-center justify-center rounded-lg border-0
        bg-transparent p-2 text-(--sl-color-gray-1)
        hover:bg-(--sl-color-gray-6)
        [&>svg]:size-radix-icon
      `}
      onClick={handleClick}
      type="button"
    >
      {theme === 'auto' && <Half2Icon />}
      {theme === 'dark' && <MoonIcon />}
      {theme === 'light' && <SunIcon />}
    </button>
  )
}
