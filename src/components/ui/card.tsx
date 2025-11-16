import * as React from "react"

type DivProps = React.HTMLAttributes<HTMLDivElement>

const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ")

// Contenedor principal
export function Card({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white text-gray-900 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

// Header
export function CardHeader({ className, ...props }: DivProps) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
}

// Título
export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
}

// Descripción (opcional si la usas)
export function CardDescription({ className, ...props }: DivProps) {
  return (
    <p className={cn("text-sm text-gray-500", className)} {...props} />
  )
}

// Contenido
export function CardContent({ className, ...props }: DivProps) {
  return <div className={cn("p-6 pt-0", className)} {...props} />
}

// Footer (opcional si lo usas)
export function CardFooter({ className, ...props }: DivProps) {
  return (
    <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
}
