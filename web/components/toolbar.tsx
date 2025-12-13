import { ComponentPropsWithoutRef, useCallback, useEffect } from "react";

import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import { store } from "@/lib/store";
import { Tool } from "@/lib/tool-settings";
import { cn } from "@/lib/utils";
import { Tooltip } from "@base-ui/react/tooltip";
import { useSelector } from "@xstate/store/react";

export function ToolIconButton({
  children,
  active,
  className,
  onClick,
  "aria-disabled": ariaDisabled,
  ...props
}: ComponentPropsWithoutRef<"button"> & { active: boolean }) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ariaDisabled) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    },
    [ariaDisabled, onClick],
  );

  return (
    <button
      {...props}
      aria-disabled={ariaDisabled}
      onClick={handleClick}
      className={cn(
        "group flex size-8 items-center justify-center border-1.5 border-border bg-white text-white",
        "rounded-none focus-visible:relative outline-none svg-outline",
        active && "[&>div]:bg-white [&_*]:invert",
        "aria-disabled:cursor-not-allowed",
        className,
      )}
    >
      <div>{children}</div>
    </button>
  );
}

const restrictedToolHandle = Tooltip.createHandle<string>();

export function Toolbar() {
  const tool = useSelector(store, (state) => state.context.toolSettings.currentTool);
  const state = useSelector(store, (state) => state.context.state);
  const user = useSelector(store, (state) => state.context.user);
  const isLoggedOut = user == null;
  const isMobile = useIsMobile();

  // Auto-select Move tool on mobile when the component mounts
  useEffect(() => {
    if (isMobile && state === "initialized") {
      store.trigger.changeTool({ tool: Tool.Move });
    }
  }, [isMobile, state]);

  if (state !== "initialized") return null;

  return (
    <Tooltip.Provider>
      <div className="flex flex-row items-start justify-end">
        <div className={cn("grid grid-cols-2 z-0 relative")}>
          <ToolIconButton
            active={tool === Tool.Brush}
            onClick={() => store.trigger.changeTool({ tool: Tool.Brush })}
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
            active={tool === Tool.Erasure}
            onClick={() => store.trigger.changeTool({ tool: Tool.Erasure })}
            className="-ml-[1px]"
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
          <Tooltip.Trigger
            handle={restrictedToolHandle}
            payload="Log in to use the line tool"
            disabled={!isLoggedOut}
            render={
              <ToolIconButton
                active={tool === Tool.Line}
                onClick={() =>
                  store.trigger.changeTool({
                    tool: Tool.Line,
                  })
                }
                className="-mt-[1px]"
                aria-disabled={isLoggedOut}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  className="stroke-primary"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 26L26 6" />
                </svg>
              </ToolIconButton>
            }
          />
          <Tooltip.Trigger
            handle={restrictedToolHandle}
            payload="Log in to claim land"
            disabled={!isLoggedOut}
            render={
              <ToolIconButton
                active={tool === Tool.Claimer}
                onClick={() =>
                  store.trigger.changeTool({
                    tool: Tool.Claimer,
                  })
                }
                className="-ml-[1px] -mt-[1px]"
                aria-disabled={isLoggedOut}
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
            }
          />
          <Tooltip.Trigger
            handle={restrictedToolHandle}
            payload="Log in to use the bucket tool"
            disabled={!isLoggedOut}
            render={
              <ToolIconButton
                active={tool === Tool.Bucket}
                onClick={() =>
                  store.trigger.changeTool({
                    tool: Tool.Bucket,
                  })
                }
                className="-mt-[2px]"
                aria-disabled={isLoggedOut}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="-4 -4 32 32"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                >
                  <path
                    d="M2.99955 13H19.9995M11.9995 3.5L10.4995 2M11.4995 3L20.3682 11.8686C20.7642 12.2646 20.9622 12.4627 21.0364 12.691C21.1016 12.8918 21.1016 13.1082 21.0364 13.309C20.9622 13.5373 20.7642 13.7354 20.3682 14.1314L14.8937 19.6059C13.7056 20.7939 13.1116 21.388 12.4266 21.6105C11.8241 21.8063 11.175 21.8063 10.5725 21.6105C9.88751 21.388 9.29349 20.7939 8.10543 19.6059L4.89366 16.3941C3.70561 15.2061 3.11158 14.612 2.88902 13.9271C2.69324 13.3245 2.69324 12.6755 2.88902 12.0729C3.11158 11.388 3.70561 10.7939 4.89366 9.60589L11.4995 3Z"
                    className="stroke-primary"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </ToolIconButton>
            }
          />
          <Tooltip.Trigger
            handle={restrictedToolHandle}
            payload="Log in to use the eyedropper"
            disabled={!isLoggedOut}
            render={
              <ToolIconButton
                active={tool === Tool.Eyedropper}
                onClick={() =>
                  store.trigger.changeTool({
                    tool: Tool.Eyedropper,
                  })
                }
                className="-ml-[1px] -mt-[2px]"
                aria-disabled={isLoggedOut}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="-5 -5 33 33"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-primary"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.5 6.49981L17.5 13.4998M2 21.9998C2 21.9998 6.5 21.4998 9 18.9998L21 6.99982C22.1046 5.89525 22.1046 4.10438 21 2.99982C19.8954 1.89525 18.1046 1.89524 17 2.99981L5 14.9998C2.5 17.4998 2 21.9998 2 21.9998Z" />
                </svg>
              </ToolIconButton>
            }
          />
          <ToolIconButton
            active={tool === Tool.Move}
            onClick={() => store.trigger.changeTool({ tool: Tool.Move })}
            className="-mt-[3px]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-primary"
              width="30"
              height="30"
              viewBox="-4 -4 32 32"
              fill="none"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 9L2 12M2 12L5 15M2 12H22M9 5L12 2M12 2L15 5M12 2V22M15 19L12 22M12 22L9 19M19 9L22 12M22 12L19 15" />
            </svg>
          </ToolIconButton>
        </div>

        <Tooltip.Root handle={restrictedToolHandle}>
          {({ payload }) => (
            <Tooltip.Portal>
              <Tooltip.Positioner side="left" sideOffset={8}>
                <Tooltip.Popup className="z-50 max-w-44 bg-primary px-3 py-1.5 text-center text-xs text-primary-foreground">
                  {payload}
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          )}
        </Tooltip.Root>
      </div>
    </Tooltip.Provider>
  );
}
