import { Input } from "./ui/input";
import { useCanvas, useContextCanvasSubscription } from "./use-canvas";
import { cn } from "@/lib/utils";

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

  return (
    <div
      className={cn(
        "flex space-x-1.5 justify-center items-center select-none text-xl",
      )}
    >
      <Input
        className="w-20"
        type="number"
        value={cameraX}
        min={-50500}
        max={50500}
        step={10}
        onChange={(e) => {
          canvas.camera.x = parseInt(e.currentTarget.value);
          canvas.emitChange();
        }}
      />
      <Input
        className="w-20"
        type="number"
        value={cameraY}
        step={10}
        min={-50500}
        max={50500}
        onChange={(e) => {
          canvas.camera.y = parseInt(e.currentTarget.value);
          canvas.emitChange();
        }}
      />
    </div>
  );
}
