import * as React from "react"

type DivProps = React.HTMLAttributes<HTMLDivElement>
type TableElementProps<T extends HTMLElement> = React.HTMLAttributes<T> & {
  className?: string
}

const cn = (...xs: Array<string | false | undefined | null>) =>
  xs.filter(Boolean).join(" ")

export function Table({ className, ...props }: TableElementProps<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-auto rounded-md border">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
}

export function TableHeader({ className, ...props }: DivProps) {
  return <thead className={cn("[&_tr]:border-b bg-gray-50", className)} {...props} />
}

export function TableBody({ className, ...props }: DivProps) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
}

export function TableRow({ className, ...props }: TableElementProps<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b transition-colors hover:bg-gray-50 data-[state=selected]:bg-gray-100",
        className
      )}
      {...props}
    />
  )
}

export function TableHead({ className, ...props }: TableElementProps<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-10 px-3 text-left align-middle font-medium text-gray-600",
        className
      )}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }: TableElementProps<HTMLTableCellElement>) {
  return <td className={cn("p-3 align-middle", className)} {...props} />
}
