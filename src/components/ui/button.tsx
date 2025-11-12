import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'default' | 'secondary' | 'destructive' | 'outline'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}

const cn = (...xs: Array<string | false | undefined | null>) => xs.filter(Boolean).join(' ')

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = 'default', ...props },
  ref
) {
  const base =
    'inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 transition-colors focus:outline-none border'

  const variants: Record<Variant, string> = {
    default: 'bg-primary text-primary-foreground hover:opacity-90 border-transparent',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-muted border-transparent',
    destructive: 'bg-destructive text-destructive-foreground hover:opacity-90 border-transparent',
    outline: 'bg-white hover:bg-muted border-border',
  }

  return <button ref={ref} className={cn(base, variants[variant], className)} {...props} />
})

export default Button
