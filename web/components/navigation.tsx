import { useCallback, useId } from "react";

import { NumberField } from "@base-ui/react/number-field";

import { IconButton } from "@/components/ui/icon-button";
import { type Action, getActionToRedo, getActionToUndo } from "@/lib/actions";
import { isAdminUser } from "@/lib/admin";
import { X_MAX, X_MIN, Y_MAX, Y_MIN, ZOOM_MIN, ZOOM_MIN_ADMIN } from "@/lib/constants";
import { roundTo1Place } from "@/lib/round-to-five";
import { store } from "@/lib/store";
import { cn } from "@/lib/utils";
import { clamp } from "@/lib/utils/clamp";
import { useSelector } from "@xstate/store/react";

import { useCameraSearchParams } from "./use-camera-search-params";

const camera = store.select((store) => store.camera);

const EMPTY_ACTIONS: Action[] = [];
const selectActions = (state: { context: { state: string; actions?: Action[] } }) =>
  state.context.state === "initialized" ? (state.context.actions ?? EMPTY_ACTIONS) : EMPTY_ACTIONS;

interface NavigationNumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onValueChange: (value: number | null) => void;
}

function NavigationNumberField({
  label,
  value,
  min,
  max,
  step,
  onValueChange,
}: NavigationNumberFieldProps) {
  const id = useId();

  return (
    <NumberField.Root
      id={id}
      value={value}
      min={min}
      max={max}
      step={step}
      largeStep={step * 10}
      onValueChange={onValueChange}
      className="flex flex-row items-center"
    >
      <NumberField.ScrubArea className="!cursor-ew-resize border-[1.5px] border-r-0 border-primary bg-background px-2 h-[30px]">
        <label
          htmlFor={id}
          className="text-sm text-primary leading-[28px] select-none block !cursor-ew-resize"
        >
          {label}
        </label>
      </NumberField.ScrubArea>

      <NumberField.Group className="flex items-center">
        <NumberField.Decrement className="flex h-7.5 w-7 items-center justify-center border-[1.5px] border-r-0 border-primary bg-white hover:bg-black hover:text-white active:bg-black active:text-white">
          <MinusIcon />
        </NumberField.Decrement>
        <NumberField.Input
          className={cn(
            "flex h-7.5 w-16 border-[1.5px] border-input bg-white text-center text-base outline-none",
            "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          )}
        />
        <NumberField.Increment className="flex h-7.5 w-7 items-center justify-center border-[1.5px] border-l-0 border-primary bg-white hover:bg-black hover:text-white active:bg-black active:text-white">
          <PlusIcon />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  );
}

function PlusIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M0 5H5M10 5H5M5 5V0M5 5V10" />
    </svg>
  );
}

function MinusIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M0 5H10" />
    </svg>
  );
}

function UndoIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}

function RedoIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
    </svg>
  );
}

function HomeIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M9 21V13.6C9 13.0399 9 12.7599 9.109 12.546C9.20487 12.3578 9.35785 12.2049 9.54601 12.109C9.75993 12 10.04 12 10.6 12H13.4C13.9601 12 14.2401 12 14.454 12.109C14.6422 12.2049 14.7951 12.3578 14.891 12.546C15 12.7599 15 13.0399 15 13.6V21M2 9.5L11.04 2.72C11.3843 2.46181 11.5564 2.33271 11.7454 2.28294C11.9123 2.23902 12.0877 2.23902 12.2546 2.28295C12.4436 2.33271 12.6157 2.46181 12.96 2.72L22 9.5M4 8V17.8C4 18.9201 4 19.4802 4.21799 19.908C4.40974 20.2843 4.7157 20.5903 5.09202 20.782C5.51985 21 6.0799 21 7.2 21H16.8C17.9201 21 18.4802 21 18.908 20.782C19.2843 20.5903 19.5903 20.2843 19.782 19.908C20 19.4802 20 18.9201 20 17.8V8L13.92 3.44C13.2315 2.92361 12.8872 2.66542 12.5091 2.56589C12.1754 2.47804 11.8246 2.47804 11.4909 2.56589C11.1128 2.66542 10.7685 2.92361 10.08 3.44L4 8Z" />
    </svg>
  );
}

export function Navigation() {
  const { x, y, zoom } = useSelector(store, (state) => state.context.camera);

  const onXChange = useCallback((value: number | null) => {
    if (value === null) return;
    store.trigger.moveCamera({
      camera: { x: roundTo1Place(clamp(value, X_MIN, X_MAX)) },
    });
  }, []);

  const onYChange = useCallback((value: number | null) => {
    if (value === null) return;
    store.trigger.moveCamera({
      camera: { y: roundTo1Place(clamp(value, Y_MIN, Y_MAX)) },
    });
  }, []);

  const onZoomChange = useCallback((value: number | null) => {
    if (value === null) return;
    const { x, y, zoom } = camera.get();

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const pixelWidth = zoom / 20;
    const pixelX = centerX / pixelWidth;
    const pixelY = centerY / pixelWidth;

    const nextPixelWidth = value / 20;

    const nextPixelX = centerX / nextPixelWidth;
    const nextPixelY = centerY / nextPixelWidth;

    const deltaXFromZoom = pixelX - nextPixelX;
    const deltaYFromZoom = pixelY - nextPixelY;

    store.trigger.moveCamera({
      camera: {
        zoom: roundTo1Place(value),
        x: roundTo1Place(clamp(x + deltaXFromZoom, X_MIN, X_MAX)),
        y: roundTo1Place(clamp(y + deltaYFromZoom, Y_MIN, Y_MAX)),
      },
    });
  }, []);

  useCameraSearchParams(x, y, zoom);

  const state = useSelector(store, (state) => state.context.state);
  const user = useSelector(store, (state) => state.context.user);
  const isAdminZoomEnabled = useSelector(
    store,
    (state) => state.context.adminSettings?.isAdminZoomEnabled,
  );
  const zoomMin = isAdminUser(user) && isAdminZoomEnabled ? ZOOM_MIN_ADMIN : ZOOM_MIN;

  const actions = useSelector(store, selectActions);
  const canUndo = getActionToUndo(actions) != null;
  const canRedo = getActionToRedo(actions) != null;

  if (state !== "initialized") return null;

  return (
    <div
      className={cn(
        "flex flex-col flex-wrap select-none items-end justify-center gap-[5px] text-xl",
      )}
    >
      <div className="flex items-center">
        <IconButton
          onClick={() => store.trigger.undo()}
          disabled={!canUndo}
          className={cn("border-r-0", !canUndo && "opacity-30")}
          aria-label="Undo"
        >
          <UndoIcon />
        </IconButton>
        <div className="bg-primary h-[32px]  w-[1.5px]" />
        <IconButton
          onClick={() => store.trigger.redo()}
          disabled={!canRedo}
          className={cn("border-r-0 border-l-0", !canRedo && "opacity-30")}
          aria-label="Redo"
        >
          <RedoIcon />
        </IconButton>
        <IconButton
          onClick={() => {
            store.trigger.moveCamera({
              camera: { x: 0, y: 0, zoom: 100 },
            });
          }}
          aria-label="Home"
        >
          <HomeIcon />
        </IconButton>
      </div>
      <NavigationNumberField
        label="X"
        value={Math.trunc(x)}
        min={X_MIN}
        max={X_MAX}
        step={5}
        onValueChange={onXChange}
      />
      <NavigationNumberField
        label="Y"
        value={Math.trunc(y)}
        min={Y_MIN}
        max={Y_MAX}
        step={5}
        onValueChange={onYChange}
      />
      <NavigationNumberField
        label="Zoom"
        value={Math.trunc(zoom)}
        min={zoomMin}
        max={1000}
        step={10}
        onValueChange={onZoomChange}
      />
    </div>
  );
}
