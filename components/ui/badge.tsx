import * as React from "react"

import { cn } from "@/lib/utils"

function Badge({ className, ...props }: React.ComponentProps<"span">) {
    return (
        <span
            data-slot="badge"
            className={cn(
                "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ring-transparent",
                className
            )}
            {...props}
        />
    )
}

export { Badge }
