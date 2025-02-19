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
      <Input
        className="w-20"
        type="number"
        name="x"
        value={cameraX}
        min={-50500}
        max={50500}
        step={10}
        onChange={onChange}
      />
      <Input
        className="w-20"
        type="number"
        name="y"
        value={cameraY}
        step={10}
        min={-50500}
        max={50500}
        onChange={onChange}
      />
    </div>
  );
}
