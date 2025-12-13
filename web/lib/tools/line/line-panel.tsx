import { NumberInput } from "@/components/ui/number-input";
import { store } from "@/lib/store";
import { useSelector } from "@xstate/store/react";

export function LinePanel() {
  const lineSize = useSelector(store, (s) => s.context.toolSettings.line.size);

  return (
    <div className="flex flex-row items-center justify-start space-x-1">
      <div>Size:</div>
      <NumberInput
        name="lineSize"
        value={lineSize}
        step={1}
        min={1}
        max={10}
        onChange={(e) =>
          store.trigger.updateLineSettings({
            line: {
              size: parseInt(e.currentTarget.value),
            },
          })
        }
      />
    </div>
  );
}
