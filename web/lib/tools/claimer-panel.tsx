import { useSelector } from "@xstate/store/react";
import { store } from "../store";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createPlot, getUserPlots } from "./claimer.rest";
import { ArrowUpRight } from "lucide-react";
import { getCenterPoint } from "../geometry/polygon";
import { centerCameraOnPoint } from "../camera-utils";

export function ClaimerPanel() {
  const activeAction = useSelector(
    store,
    (state) => state.context.activeAction,
  );

  const { data: plots } = useQuery({
    queryKey: ["user", "plots"],
    queryFn: getUserPlots,
  });

  return (
    <div className="flex-grow flex flex-col items-start justify-between">
      {activeAction?.type === "claimer-active" ? <ClaimButton /> : <div />}

      <div className="flex flex-col items-start justify-start space-y-1">
        {plots?.map((plot) => (
          <div
            key={plot.id}
            className="isolate relative z-0 flex group flex-row space-x-1"
          >
            <Button
              variant="link"
              className=""
              onClick={() => {
                store.trigger.moveCamera({
                  camera: centerCameraOnPoint(getCenterPoint(plot.polygon), store.getSnapshot().context.camera),
                });
              }}
            >
              {plot.name} {getCenterPoint(plot.polygon)}{" "}
              <ArrowUpRight className="hidden group-hover:block group-focus:block w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClaimButton() {
  const { mutate } = useMutation({
    mutationFn: createPlot,
    onSettled: () => {
      store.trigger.completeClaim();
    },
  });

  return (
    <div className="flex flex-col items-start justify-start">
      <Button onClick={() => mutate()}>Claim</Button>
    </div>
  );
}
