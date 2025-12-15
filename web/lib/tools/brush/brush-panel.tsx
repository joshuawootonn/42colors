import { NumberField } from "@/components/ui/number-field";
import { useSelector } from "@xstate/store/react";

import { store } from "../../store";

export function BrushPanel() {
  const brushSize = useSelector(store, (s) => s.context.toolSettings.brush.size);

  return (
    <NumberField
      label="Size"
      value={brushSize}
      step={1}
      min={1}
      max={10}
      onValueChange={(value) => {
        if (value != null) {
          store.trigger.updateBrushSettings({
            brush: { size: value },
          });
        }
      }}
    />
  );
}
