import { cn } from "@/lib/utils";
import { ComponentPropsWithoutRef } from "react";

export function Button({
  className,
  ...props
}: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      className={cn(
        "outline-none svg-outline-sm relative no-underline",
        className,
      )}
      {...props}
    />
  );
}
