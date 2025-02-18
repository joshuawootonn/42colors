import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <div className={cn("relative svg-outline-within-sm", className)}>
        <input
          type={type}
          className={cn(
            "flex h-8 w-full border-2 border-input bg-transparent text-base",
            "pl-1",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            "placeholder:text-muted-foreground outline-none ",
            "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
