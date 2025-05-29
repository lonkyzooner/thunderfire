import * as React from "react"

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: string
}

function Badge({ ...props }: BadgeProps) {
  return (
    <div {...props} />
  )
}

export { Badge }
