import { NumberInput } from "@/components/ui/number-input";
import { useSelector } from "@xstate/store/react";
import { store } from "../store";

export function BrushPanel() {
  const brushSize = useSelector(
    store,
    (s) => s.context.toolSettings.brush.size,
  );

  return (
    <div className="flex flex-col items-start justify-start">
      <NumberInput
        name="brushSize"
        value={brushSize}
        step={1}
        min={1}
        max={5}
        onChange={(e) =>
          store.trigger.updateBrushSettings({
            brush: {
              size: parseInt(e.currentTarget.value),
            },
          })
        }
      />
    </div>
  );
}
