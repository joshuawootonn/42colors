import { NumberInput } from "@/components/ui/number-input";
import { useSelector } from "@xstate/store/react";
import { brushSizeState } from "./brush";

export function BrushPanel() {
  const brushSize = useSelector(brushSizeState, (s) => s);

  return (
    <div className="flex flex-col items-start justify-start">
      <NumberInput
        name="brushSize"
        value={brushSize}
        step={1}
        min={1}
        max={5}
        onChange={(e) => brushSizeState.set(parseInt(e.currentTarget.value))}
      />
    </div>
  );
}
