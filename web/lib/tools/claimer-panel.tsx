import { useSelector } from "@xstate/store/react";
import { store } from "../store";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createPlot,
  deletePlot,
  getUserPlots,
  updatePlot,
  type Plot,
} from "./claimer.rest";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/icon-button";
import { X } from "@/components/icons/x";
import * as Tooltip from "@/components/ui/tooltip";
import { useMemo } from "react";

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

  const { mutate: deleteSelectedPlot } = useMutation({
    mutationFn: deletePlot,
    onSuccess: () => {
      store.getSnapshot().context.queryClient?.invalidateQueries({
        queryKey: ["user", "plots"],
      });
      store.trigger.redrawRealtimeCanvas();
      store.trigger.deselectPlot();
    },
  });

  const { mutate: updateSelectedPlot } = useMutation({
    mutationFn: ({
      plotId,
      plot,
    }: {
      plotId: number;
      plot: Partial<Pick<Plot, "name" | "description">>;
    }) => updatePlot(plotId, plot),
    onSuccess: () => {
      store.getSnapshot().context.queryClient?.invalidateQueries({
        queryKey: ["user", "plots"],
      });
      store.trigger.redrawRealtimeCanvas();
    },
  });

  const selectedPlot = useMemo(() => plots?.find((plot) => plot.id === selectedPlotId), [plots, selectedPlotId]);

  return (
    <div className="flex-grow flex flex-row items-start justify-start">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="link" className="">
            {activeAction?.type === "claimer-active" ? (
              "New Claim"
            ) : selectedPlot ? (
              selectedPlot.name
            ) : (
              <>
                Select Plot{" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="-4 -4 32 32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 7h10v10" />
                  <path d="M7 17 17 7" />
                </svg>
              </>
            )}
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
      {activeAction?.type === "claimer-active" ? (
        <>
          <ClaimButton />
          <IconButton
            className="text-black"
            onClick={() => {
              store.trigger.clearClaim();
            }}
          >
            <X />
          </IconButton>
        </>
      ) : selectedPlot ? (
        <>
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger
                render={
                  <IconButton
                    className="text-black"
                    onClick={() => {
                      if (selectedPlotId) {
                        updateSelectedPlot({
                          plotId: selectedPlotId,
                          plot: {
                            name: "Updated Plot",
                            description: "Updated Description",
                          },
                        });
                      }
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="-4 -4 32 32"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
                      <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
                    </svg>
                  </IconButton>
                }
              />
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup>
                    <Tooltip.Arrow />
                    Update
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>

            <Tooltip.Root>
              <Tooltip.Trigger>
                <IconButton
                  className="text-black -translate-x-[1px]"
                  onClick={() => {
                    if (selectedPlotId) {
                      deleteSelectedPlot(selectedPlotId);
                    }
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="-4 -4 32 32"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" x2="10" y1="11" y2="17" />
                    <line x1="14" x2="14" y1="11" y2="17" />
                  </svg>
                </IconButton>
              </Tooltip.Trigger>

              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup>
                    <Tooltip.Arrow />
                    Delete
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        </>
      ) : null}
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
