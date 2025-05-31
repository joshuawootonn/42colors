import { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";
import { useSelector } from "@xstate/store/react";
import { store } from "@/lib/store";

export function ToolIconButton({
  children,
  active,
  ...props
}: ComponentPropsWithoutRef<"button"> & { active: boolean }) {
  return (
    <button
      {...props}
      className={cn(
        "group flex justify-center items-center bg-white text-white size-8 border-1.5 border-black ring-1 ring-black",
        "relative",
        "focus-visible:border-black outline-none rounded-none",
        active && "border-white ring-white invert",
      )}
    >
      <div>{children}</div>
    </button>
  );
}

export function Toolbar() {
  const tool = useSelector(
    store,
    (state) => state.context.toolSettings.currentTool,
  );
  const state = useSelector(store, (state) => state.context.state);
  if (state !== "initialized") return null;
  return (
    <div className="flex flex-row justify-end items-start">
      <div className={cn("p-0.5 grid grid-cols-2")}>
        <ToolIconButton
          active={tool === "brush"}
          onClick={() => store.trigger.changeTool({ tool: "brush" })}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.1381 13.0183L8.9007 15.189L11.1381 18.7558C9.15983 20.0853 8.90045 20.187 6.82517 22.4199C4.26363 25.1761 7.91917 26.8835 9.90602 25.3383C11.4303 24.1528 12.6726 22.5605 13.6346 21.1878L16.8775 23.4576L19.1849 20.8725M11.1381 13.0183L18.1096 6.07733L20.7677 8.67033L23.4108 11.2487L26.054 13.8271L19.1849 20.8725M11.1381 13.0183L19.1849 20.8725"
              className="stroke-primary"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20.1739 7.90596C16.8036 12.0158 15.8201 14.9442 21.0244 9.25097L20.1739 7.90596Z"
              className="fill-primary"
            />
            <path
              d="M22.4003 10.9234C17.8105 15.8547 16.822 18.8329 23.9094 12.0016L22.4003 10.9234Z"
              className="fill-primary"
            />
          </svg>
        </ToolIconButton>
        <ToolIconButton
          active={tool === "erasure"}
          onClick={() => store.trigger.changeTool({ tool: "erasure" })}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="-3 -4 32 32"
            fill="none"
            className="stroke-primary"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
            <path d="M22 21H7" />
            <path d="m5 11 9 9" />
          </svg>
        </ToolIconButton>
        <ToolIconButton
          active={tool === "claimer"}
          onClick={() => store.trigger.changeTool({ tool: "claimer" })}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            fill="none"
            viewBox="-3.5 -4 32 32"
            className="stroke-primary"
            strokeWidth="1.75"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"
            />
          </svg>
        </ToolIconButton>
      </div>
    </div>
  );
}
