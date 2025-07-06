import { useSelector } from "@xstate/store/react";
import { store } from "../../store";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createPlot,
  deletePlot,
  getUserPlots,
  updatePlot,
  type Plot,
  PlotError,
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const plotCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be less than 255 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .nullable(),
});

const plotUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be less than 255 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .nullable(),
});

type PlotCreateForm = z.infer<typeof plotCreateSchema>;
type PlotUpdateForm = z.infer<typeof plotUpdateSchema>;

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
  const user = useSelector(store, (state) => state.context.user);

  if (user == null) return null;

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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<PlotUpdateForm>({
    resolver: zodResolver(plotUpdateSchema),
    defaultValues: {
      name: plot.name,
      description: plot.description,
    },
  });

  const { mutate: updatePlotMutation } = useMutation({
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
    onError: (error) => {
      if (error instanceof PlotError) {
        Object.entries(error.errors).forEach(([field, messages]) => {
          if (field === "name" || field === "description") {
            setError(field, { type: "server", message: messages[0] });
          }
        });
      } else {
        // Handle general errors
        setError("root", { type: "server", message: error.message });
      }
    },
  });

  const onSubmit = (data: PlotUpdateForm) => {
    updatePlotMutation({
      plotId: plot.id,
      plot: data,
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      reset({
        name: plot.name,
        description: plot.description,
      });
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <div>
            <h3 className="font-semibold mb-2">Edit Plot</h3>
          </div>

          {errors.root && (
            <div className="text-red-600 text-sm mb-2">
              {errors.root.message}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="edit-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="edit-name"
              {...register("name")}
              placeholder="Name"
              disabled={isSubmitting}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <div className="text-red-600 text-sm">{errors.name.message}</div>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="edit-description"
              {...register("description")}
              placeholder="Description"
              disabled={isSubmitting}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <div className="text-red-600 text-sm">
                {errors.description.message}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<PlotCreateForm>({
    resolver: zodResolver(plotCreateSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const { mutate: createPlotMutation } = useMutation({
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
      reset();
    },
    onError: (error) => {
      if (error instanceof PlotError) {
        Object.entries(error.errors).forEach(([field, messages]) => {
          if (field === "name" || field === "description") {
            setError(field, { type: "server", message: messages[0] });
          }
        });
      } else {
        setError("root", { type: "server", message: error.message });
      }
    },
  });

  const onSubmit = (data: PlotCreateForm) => {
    createPlotMutation({
      name: data.name.trim(),
      description: data.description?.trim(),
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form when closing
      reset();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button>Claim</Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 px-3 py-2 bg-background border-1.5 border-primary">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <div>
            <h3 className="font-semibold mb-2">Create Plot</h3>
          </div>

          {errors.root && (
            <div className="text-red-600 text-sm mb-2">
              {errors.root.message}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="create-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="create-name"
              {...register("name")}
              placeholder="Name"
              disabled={isSubmitting}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <div className="text-red-600 text-sm">{errors.name.message}</div>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="create-description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="create-description"
              {...register("description")}
              placeholder="Description"
              disabled={isSubmitting}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <div className="text-red-600 text-sm">
                {errors.description.message}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
