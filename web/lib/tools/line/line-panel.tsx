import { NumberField } from "@/components/ui/number-field";
import { store } from "@/lib/store";
import { useSelector } from "@xstate/store/react";

export function LinePanel() {
  const lineSize = useSelector(store, (s) => s.context.toolSettings.line.size);

  return (
    <NumberField
      label="Size"
      value={lineSize}
      step={1}
      min={1}
      max={10}
      onValueChange={(value) => {
        if (value != null) {
          store.trigger.updateLineSettings({
            line: { size: value },
          });
        }
      }}
    />
  );
}
