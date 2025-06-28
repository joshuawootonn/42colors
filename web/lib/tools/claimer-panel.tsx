import { useSelector } from "@xstate/store/react";
import { store } from "../store";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPlot, getUserPlots } from "./claimer.rest";

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
    <div>
      {activeAction?.type === "claimer-active" && <ClaimButton />}

      <div className="flex flex-col items-start justify-start">
        {plots?.map((plot) => (
          <div key={plot.id}>{plot.name}</div>
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
