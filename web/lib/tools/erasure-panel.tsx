import { NumberInput } from "@/components/ui/number-input";
import { useSelector } from "@xstate/store/react";
import { store } from "../store";

export function ErasurePanel() {
  const brushSize = useSelector(
    store,
    (s) => s.context.toolSettings.erasure.size,
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
          store.trigger.updateErasureSettings({
            erasure: {
              size: parseInt(e.currentTarget.value),
            },
          })
        }
      />
    </div>
  );
}
