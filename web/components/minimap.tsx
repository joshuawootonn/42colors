import { PointerEvent, useRef } from "react";
import { useCanvas, useContextCanvasSubscription } from "./use-canvas";
import { cn } from "@/lib/utils";

export function Minimap() {
  const canvas = useCanvas();
  const cameraX = useContextCanvasSubscription(
    (canvas) => canvas.getCameraState().x,
    [],
  );
  const cameraY = useContextCanvasSubscription(
    (canvas) => canvas.getCameraState().y,
    [],
  );

  const dragState = useRef<{
    startingX: number;
    startingY: number;
    startingCameraX: number;
    startingCameraY: number;
  } | null>(null);

  return (
    <div
      className={cn(
        "flex space-x-1 justify-center items-center select-none font-bold text-xl border-primary border-1.5 aspect-square size-50 bg-white",
      )}
      onPointerDown={(e: PointerEvent) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const startingCamera = canvas.camera.clone();
        const startingX = e.clientX;
        const startingY = e.clientY;

        dragState.current = {
          startingX,
          startingY,
          startingCameraX: startingCamera.x,
          startingCameraY: startingCamera.y,
        };
      }}
      onPointerMove={(e: PointerEvent) => {
        if (dragState.current == null) return;
        canvas.camera.x =
          dragState.current.startingCameraX -
          (e.clientX - dragState.current.startingX) * 10;
        canvas.camera.y =
          dragState.current.startingCameraY -
          (e.clientY - dragState.current.startingY) * 10;
      }}
      onPointerUp={() => {
        dragState.current = null;
      }}
    >
      <div>{cameraX}</div>,<div>{cameraY}</div>
    </div>
  );
}
