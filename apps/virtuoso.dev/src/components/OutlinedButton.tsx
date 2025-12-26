import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { DashboardIcon } from '@radix-ui/react-icons'

type OutlinedButtonAsLink = Omit<ComponentPropsWithoutRef<'a'>, 'className' | 'href'> & {
  as?: 'a'
  href: string
  onClick?: never
}

type OutlinedButtonAsButton = Omit<ComponentPropsWithoutRef<'button'>, 'className' | 'onClick'> & {
  as: 'button'
  href?: never
  onClick?: ComponentPropsWithoutRef<'button'>['onClick']
}

type OutlinedButtonProps = (OutlinedButtonAsButton | OutlinedButtonAsLink) & {
  children: ReactNode
  className?: string
}

export default function OutlinedButton({ as = 'a', children, className = '', ...props }: OutlinedButtonProps) {
  const baseClassName =
    'inline-flex items-center gap-2 rounded-full border-2 border-(--sl-color-white) px-6 py-3 text-lg font-medium text-(--sl-color-white) transition-all hover:border-(--sl-color-accent) hover:text-(--sl-color-accent)'
  const combinedClassName = `${baseClassName} ${className}`

  if (as === 'button') {
    return (
      <button className={combinedClassName} {...(props as ComponentPropsWithoutRef<'button'>)}>
        {children}
        <DashboardIcon className="size-5" />
      </button>
    )
  }

  return (
    <a className={combinedClassName} {...(props as ComponentPropsWithoutRef<'a'>)}>
      {children}
      <DashboardIcon className="size-5" />
    </a>
  )
}
