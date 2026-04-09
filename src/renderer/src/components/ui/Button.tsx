import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'ghost', size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'md' && 'px-4 py-2 text-sm',
          variant === 'primary' && [
            'text-white',
            'bg-[var(--color-brand)] hover:brightness-110 active:brightness-95',
          ],
          variant === 'ghost' && [
            'text-[var(--text-secondary)]',
            'hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]',
            'active:bg-[var(--bg-subtle)]',
          ],
          variant === 'danger' && [
            'text-[#ef4444]',
            'hover:bg-[color-mix(in_srgb,#ef4444_10%,transparent)]',
          ],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
