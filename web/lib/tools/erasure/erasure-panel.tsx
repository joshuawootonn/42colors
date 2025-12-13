import { NumberInput } from "@/components/ui/number-input";
import { store } from "@/lib/store";
import { useSelector } from "@xstate/store/react";

export function ErasurePanel() {
  const brushSize = useSelector(store, (s) => s.context.toolSettings.erasure.size);

  return (
    <div className="flex flex-row items-center justify-start space-x-1">
      <div>Size:</div>
      <NumberInput
        name="brushSize"
        value={brushSize}
        step={1}
        min={1}
        max={10}
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
