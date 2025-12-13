"use client";

import clsx from "clsx";

import { useEffect, useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export function EmailLink({ children, className }: { children?: string; className?: string }) {
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
    <Popover open={isOpen} type="temporary">
      <PopoverTrigger
        render={(props) => (
          <button
            {...props}
            tabIndex={0}
            className={clsx("relative z-[5] font-medium", className)}
            onClick={(e) => {
              props.onClick?.(e);
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
        )}
      />
      <PopoverContent
        positionerProps={{
          side: "top",
          sideOffset: 4,
        }}
        isDraggable={false}
        hideCloseButton={true}
        className="px-2 py-1"
      >
        Copied
      </PopoverContent>
    </Popover>
  );
}
