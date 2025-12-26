import { ChevronDownIcon, GitHubLogoIcon } from '@radix-ui/react-icons'
import { useEffect, useRef, useState } from 'react'

import { ThemeSelect } from './ThemeSelect'

interface NavLink {
  href: string
  isActive: boolean
  label: string
}

interface MobileMenuProps {
  navLinks: NavLink[]
}

export function MobileMenu({ navLinks }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <div className="md:hidden" ref={menuRef}>
      <button
        aria-controls="mobile-menu-panel"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close top-level menu' : 'Open top-level menu'}
        className={`
          flex cursor-pointer items-center gap-1 rounded-lg border-0
          bg-transparent px-2 py-1.5 text-sm font-medium
          text-(--sl-color-gray-1)
          hover:bg-(--sl-color-gray-6)
        `}
        onClick={() => {
          setIsOpen(!isOpen)
        }}
        ref={buttonRef}
        type="button"
      >
        Navigation
        <ChevronDownIcon
          className={`
            size-radix-icon transition-transform duration-200
            ${isOpen ? 'rotate-180' : ''}
          `}
        />
      </button>

      {isOpen && (
        <>
          <div
            aria-hidden="true"
            className={`
              fixed inset-0 top-(--sl-nav-height) z-(--sl-z-index-menu)
              bg-black/50
            `}
          />
          <div
            className={`
              fixed top-(--sl-nav-height) right-0 left-0 z-(--sl-z-index-menu)
              animate-in border-b border-(--sl-color-hairline-shade)
              bg-(--sl-color-bg-nav) shadow-lg duration-200 fade-in
              slide-in-from-top-2
            `}
            id="mobile-menu-panel"
          >
            <nav className="flex flex-col p-4">
              {navLinks.map((link) => (
                <a
                  className={`
                    border-b border-(--sl-color-gray-6) px-2 py-3 text-base
                    font-medium no-underline transition-colors duration-200
                    ${
                      link.isActive
                        ? 'text-(--sl-color-text-accent)'
                        : `
                          text-(--sl-color-white)
                          hover:text-(--sl-color-text-accent)
                        `
                    }
                  `}
                  href={link.href}
                  key={link.href}
                  onClick={() => {
                    setIsOpen(false)
                  }}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div
              className={`
                flex items-center justify-between gap-4 border-t
                border-(--sl-color-gray-6) px-4 py-3
              `}
            >
              <a
                className={`
                  flex items-center gap-2 text-(--sl-color-gray-2)
                  hover:text-(--sl-color-text-accent)
                `}
                href="https://github.com/petyosi/react-virtuoso"
                onClick={() => {
                  setIsOpen(false)
                }}
                rel="me"
              >
                <GitHubLogoIcon className="size-radix-icon" />
                <span className="text-sm">GitHub</span>
              </a>
              <ThemeSelect />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
