import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

export function getStarlightTheme(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export function useStarlightTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(getStarlightTheme)

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(getStarlightTheme())
    })

    observer.observe(document.documentElement, {
      attributeFilter: ['data-theme'],
      attributes: true,
    })

    setTheme(getStarlightTheme())

    return () => {
      observer.disconnect()
    }
  }, [])

  return theme
}
