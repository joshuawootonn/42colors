import * as React from "react";

import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<"input"> & {
  allowPasswordManager?: boolean;
};

const PASSWORD_MANAGER_DISABLED_PROPS = {
  autoComplete: "off" as const,
  "data-form-type": "other",
  "data-lpignore": "true",
  "data-1p-ignore": "true",
  "data-fill-on-account": "true",
  "data-bwignore": "true",
};

const PASSWORD_MANAGER_ENABLED_PROPS = {};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, allowPasswordManager = false, ...props }, ref) => {
    const passwordManagerProps = allowPasswordManager
      ? PASSWORD_MANAGER_ENABLED_PROPS
      : PASSWORD_MANAGER_DISABLED_PROPS;

    return (
      <div className={cn("svg-outline-within-sm relative z-0", className)}>
        <input
          type={type}
          className={cn(
            "flex h-8 w-full border-1.5 border-input bg-transparent text-base",
            "pl-1",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            "outline-none placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
          ref={ref}
          {...passwordManagerProps}
          {...props}
        />
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
