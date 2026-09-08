import * as React from "react"

import { cn } from "@/lib/utils"
import { adminTextareaClass } from "@/features/admin/ui/styles"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(adminTextareaClass, className)}
      {...props}
    />
  )
}

export { Textarea }
