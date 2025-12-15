import { NumberField } from "@/components/ui/number-field";
import { store } from "@/lib/store";
import { useSelector } from "@xstate/store/react";

export function ErasurePanel() {
  const erasureSize = useSelector(store, (s) => s.context.toolSettings.erasure.size);

  return (
    <NumberField
      label="Size"
      value={erasureSize}
      step={1}
      min={1}
      max={10}
      onValueChange={(value) => {
        if (value != null) {
          store.trigger.updateErasureSettings({
            erasure: { size: value },
          });
        }
      }}
    />
  );
}
