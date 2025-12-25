import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  `
    inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium
    whitespace-nowrap transition-colors
    focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none
    disabled:pointer-events-none disabled:opacity-50
    [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0
  `,
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'h-9 px-4 py-2',
        icon: 'size-9',
        lg: 'h-10 rounded-md px-8',
        radixIcon: `
          size-7
          [&_svg]:size-radix-icon
        `,
        sm: 'h-8 rounded-md px-3 text-xs',
      },
      variant: {
        default: `
          bg-primary text-primary-foreground shadow
          hover:bg-primary/90
        `,
        destructive: `
          text-destructive-foreground bg-destructive shadow-sm
          hover:bg-destructive/90
        `,
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: `
          text-primary underline-offset-4
          hover:underline
        `,
        outline: `
          border border-input bg-background shadow-sm
          hover:bg-accent hover:text-accent-foreground
        `,
        secondary: `
          bg-secondary text-secondary-foreground shadow-sm
          hover:bg-secondary/80
        `,
      },
    },
  }
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ asChild = false, className, size, variant, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ className, size, variant }))} ref={ref} {...props} />
})
Button.displayName = 'Button'

export { Button, buttonVariants }
