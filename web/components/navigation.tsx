import { Input } from "./ui/input";
import { useCanvas, useContextCanvasSubscription } from "./use-canvas";
import { cn } from "@/lib/utils";
import { ChangeEvent, useCallback } from "react";
import { useCameraSearchParams } from "./use-camera-search-params";
import { z } from "zod";

const numberSchema = z.number();

export function Navigation() {
  const canvas = useCanvas();
  const cameraX = useContextCanvasSubscription(
    (canvas) => canvas.getCameraState().x,
    [],
  );
  const cameraY = useContextCanvasSubscription(
    (canvas) => canvas.getCameraState().y,
    [],
  );

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const parsedNumber = numberSchema.safeParse(
        parseInt(e.currentTarget.value),
      );
      const next = parsedNumber.success ? parsedNumber.data : 0;

      if (e.currentTarget.name === "x") {
        canvas.camera.x = next;
      } else if (e.currentTarget.name === "y") {
        canvas.camera.y = next;
      }

      canvas.emitChange();
    },
    [canvas],
  );

  useCameraSearchParams(cameraX, cameraY);

  return (
    <div
      className={cn(
        "flex space-x-1.5 justify-center items-center select-none text-xl",
      )}
    >
      <button
        onClick={() => {
          canvas.camera.x = 0;
          canvas.camera.y = 0;
          canvas.emitChange();
        }}
        className={
          "flex justify-center items-center h-8 bg-transparent text-base"
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
          <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
      </button>
      <Input
        className="w-20"
        type="number"
        name="x"
        value={cameraX}
        min={-50500}
        max={50500}
        step={5}
        onChange={onChange}
      />
      <Input
        className="w-20"
        type="number"
        name="y"
        value={cameraY}
        step={5}
        min={-50500}
        max={50500}
        onChange={onChange}
      />
    </div>
  );
}
