import { cn } from "@/lib/utils";
import { ComponentPropsWithoutRef } from "react";

export function IconButton({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"button"> & {}) {
  return (
    <button
      {...props}
      className={cn(
        "relative group flex justify-center items-center bg-white text-white size-8 border-1.5 border-black ",
        "focus-visible:border-black outline-none rounded-none",
        className,
      )}
    >
      {children}
    </button>
  );
}
