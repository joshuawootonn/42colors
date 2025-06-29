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
import { useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

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

  const selectedPlot = useMemo(
    () => plots?.find((plot) => plot.id === selectedPlotId),
    [plots, selectedPlotId],
  );

  return (
    <div className="flex-grow flex flex-row items-start justify-start">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
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
                  className="-mr-2"
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
            <EditPlotForm plot={selectedPlot} />

            <Tooltip.Root>
              <Tooltip.Trigger>
                <IconButton
                  className="text-black -translate-x-[2px]"
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
                    Update
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

function EditPlotForm({ plot }: { plot: Plot }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(plot.name);
  const [description, setDescription] = useState(plot.description);

  const { mutate: updatePlotMutation, isPending } = useMutation({
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
      setIsOpen(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlotMutation({
      plotId: plot.id,
      plot: {
        name,
        description,
      },
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Reset form to current plot values when opening
      setName(plot.name);
      setDescription(plot.description);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <Tooltip.Root>
        <Tooltip.Trigger
          render={
            <PopoverTrigger asChild>
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
                  <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
                  <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
                </svg>
              </IconButton>
            </PopoverTrigger>
          }
        />
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup>
              <Tooltip.Arrow />
              Edit
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>

      <PopoverContent className="w-80 px-3 py-2 bg-background border-1.5 border-primary">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div>
            <h3 className="font-semibold mb-2">Edit Plot</h3>
          </div>
          
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              disabled={isPending}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              disabled={isPending}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function ClaimButton() {
  return (
    <div className="flex flex-col items-start justify-start">
      <CreatePlotForm />
    </div>
  );
}

function CreatePlotForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { mutate: createPlotMutation, isPending } = useMutation({
    mutationFn: createPlot,
    onSuccess: (plot) => {
      store.getSnapshot().context.queryClient?.invalidateQueries({
        queryKey: ["user", "plots"],
      });
      store.trigger.completeClaim();
      store.trigger.selectPlot({ plotId: plot.id });
      store.trigger.redrawRealtimeCanvas();
      setIsOpen(false);
      // Reset form
      setName("");
      setDescription("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPlotMutation({
      name: name.trim() || `Plot ${Date.now()}`,
      description: description.trim() || `Description ${Date.now()}`,
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form when closing
      setName("");
      setDescription("");
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button>Claim</Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 px-3 py-2 bg-background border-1.5 border-primary">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div>
            <h3 className="font-semibold mb-2">Create Plot</h3>
          </div>
          
          <div className="space-y-1">
            <label htmlFor="create-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="create-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              disabled={isPending}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="create-description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="create-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              disabled={isPending}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
