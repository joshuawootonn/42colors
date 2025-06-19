import { useSelector } from "@xstate/store/react";
import { store } from "../store";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPlot } from "./claimer.rest";

export function ClaimerPanel() {
  const activeAction = useSelector(
    store,
    (state) => state.context.activeAction,
  );

  if (activeAction?.type !== "claimer-active") return null;

  return <ClaimButton />;
}

function ClaimButton() {
  const { mutate } = useMutation({
    mutationFn: createPlot,
    onSettled: () => {
      store.trigger.completeClaim();
    },
  });
  const queryClient = useQueryClient();

  return (
    <div className="flex flex-col items-start justify-start">
      <Button onClick={() => mutate()}>Claim</Button>
    </div>
  );
}
