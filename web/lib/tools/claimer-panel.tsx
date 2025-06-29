import { useSelector } from "@xstate/store/react";
import { store } from "../store";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createPlot, getUserPlots } from "./claimer.rest";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/icon-button";
import { X } from "@/components/icons/x";

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
            {activeAction?.type === "claimer-active" ? (
              "New Claim"
            ) : selectedPlotId ? (
              plots?.find((plot) => plot.id === selectedPlotId)?.name
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
      ) : (
        <>
          {/* <IconButton className="text-black">
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
              <path d="M13 7 8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13" />
              <path d="m8 6 2-2" />
              <path d="m18 16 2-2" />
              <path d="m17 11 4.3 4.3c.94.94.94 2.46 0 3.4l-2.6 2.6c-.94.94-2.46.94-3.4 0L11 17" />
              <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
              <path d="m15 5 4 4" />
            </svg>
          </IconButton>
          <IconButton className="text-black -translate-x-[1px]">
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
          </IconButton> */}
        </>
      )}
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
