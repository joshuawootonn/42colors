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
  const tool = useSelector(store, (state) => state.context.currentTool);
  return (
    <div className="flex flex-row justify-end items-start">
      <div className={cn("p-0.5 grid grid-cols-2")}>
        <ToolIconButton
          active={tool === "pencil"}
          onClick={() => store.trigger.changeTool({ tool: "pencil" })}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M23.4576 12.8967L11.7578 24.3561L8.83289 25.1574M23.4576 12.8967C25.7815 11.0536 26.2382 8.98528 24.6596 7.52761C23.1089 6.09567 21.2939 7.04679 19.4508 8.97005M23.4576 12.8967L19.4508 8.97005M19.4508 8.97005L7.83117 20.3493L6.98882 22.8062M6.98882 22.8062L5.90796 25.9588L8.83289 25.1574M6.98882 22.8062C6.98882 22.8062 7.88216 23.3063 8.25973 23.8153M8.83289 25.1574C8.83289 25.1574 8.59928 24.273 8.25973 23.8153M8.25973 23.8153L6.98882 24.9066"
              className="stroke-primary"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </ToolIconButton>
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
      </div>
    </div>
  );
}
