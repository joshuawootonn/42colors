import { useSelector } from "@xstate/store/react";
import { store } from "../store";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createPlot, getUserPlots } from "./claimer.rest";
import { ArrowUpRight, Cog, CogIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ClaimerPanel() {
  const activeAction = useSelector(
    store,
    (state) => state.context.activeAction,
  );

  const selectedPlotId = useSelector(
    store,
    (state) => state.context.toolSettings.claimer.selectedPlotId,
  );

  const { data: plots } = useQuery({
    queryKey: ["user", "plots"],
    queryFn: getUserPlots,
  });

  return (
    <div className="flex-grow flex flex-row items-start justify-start">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="link" className="">
            {selectedPlotId
              ? plots?.find((plot) => plot.id === selectedPlotId)?.name
              : "Select Plot"}
            <ArrowUpRight className="hidden group-hover:block group-focus:block w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent>
          {plots?.map((plot) => {
            return (
              <DropdownMenuItem
                onSelect={() => {
                  store.trigger.selectPlot({ plotId: plot.id });
                }}
                key={plot.id}
              >
                {plot.name}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      {activeAction?.type === "claimer-active" ? <ClaimButton /> : null}
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
