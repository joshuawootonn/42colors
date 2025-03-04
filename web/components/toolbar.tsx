import { ComponentPropsWithoutRef } from "react";
import { useCanvas, useContextCanvasSubscription } from "./use-canvas";
import { cn } from "@/lib/utils";

function IconButton({
  children,
  active,
  ...props
}: ComponentPropsWithoutRef<"button"> & { active: boolean }) {
  return (
    <button
      {...props}
      className={cn(
        "group flex justify-center items-center bg-white size-8 border-1.5 border-transparent border-dashed",

        "focus-visible:border-black outline-none rounded-none",
        "active:bg-black active:text-white active:focus-visible:border-white",
        active && "bg-black text-white focus-visible:border-white",
      )}
    >
      <div>{children}</div>
    </button>
  );
}

export function Toolbar() {
  const canvas = useCanvas();
  const mode = useContextCanvasSubscription((canvas) => canvas.getMode(), []);
  return (
    <div
      className={cn(
        "bg-black gap-0.5 p-0.5 grid grid-cols-2",
        "border-l-black border-l border-b-black border-b",
      )}
    >
      <IconButton active={mode === "pan"} onClick={() => canvas.setMode("pan")}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
          <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
          <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
        </svg>{" "}
      </IconButton>

      <IconButton
        active={mode === "pencil"}
        onClick={() => canvas.setMode("pencil")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
          <path d="m15 5 4 4" />
        </svg>
      </IconButton>
    </div>
  );
}
