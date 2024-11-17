"use client";

import clsx from "clsx";

import { useEffect, useState } from "react";
import {
  PopoverArrow,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";

export function EmailLink({
  children,
  className,
  popoverClassName,
}: {
  children?: string;
  className?: string;
  popoverClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => {
        setIsOpen(false);
      }, 2000);

      return () => {
        clearTimeout(t);
      };
    }
  }, [isOpen]);

  return (
    <Popover open={isOpen}>
      <PopoverTrigger asChild>
        <button
          tabIndex={0}
          className={clsx("relative z-[5] font-medium", className)}
          onClick={() => {
            setIsOpen(true);
            const el = document.createElement("textarea");
            el.value = "joshuawootonn@gmail.com";
            document.body.appendChild(el);
            el.select();
            document.execCommand("copy");
            document.body.removeChild(el);
          }}
        >
          {children ?? "josh@typetheword.site"}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={"top"}
        className="block border-2 border-primary bg-secondary px-2 py-1 font-medium outline-none"
        align={"center"}
        sideOffset={5}
      >
        <span className={clsx(popoverClassName)}>Copied</span>

        <PopoverArrow className="PopoverArrow dark:fill-secondary" />
      </PopoverContent>
    </Popover>
  );
}
