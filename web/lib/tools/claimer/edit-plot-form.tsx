import { z } from "zod";

import { ComponentPropsWithoutRef, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverHeading, PopoverTrigger } from "@/components/ui/popover";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

import { ACTION_TYPES } from "../../action-types";
import { store } from "../../store";
import { isInitialStore } from "../../utils/is-initial-store";
import { type Plot, PlotError, updatePlot } from "./claimer.rest";

const plotUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be less than 255 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").nullable(),
  polygon: z.any(),
});

type PlotUpdateForm = z.infer<typeof plotUpdateSchema>;

interface EditPlotFormProps {
  plot: Plot;
  triggerProps?: ComponentPropsWithoutRef<"button">;
}

export function EditPlotForm({ plot, triggerProps }: EditPlotFormProps) {
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
      plot: Partial<Pick<Plot, "name" | "description" | "polygon">>;
    }) => updatePlot(plotId, plot),
    onSuccess: (updatedPlot) => {
      const context = store.getSnapshot().context;

      // Immediately update the user plots cache with the new plot data
      // This ensures tools like bucket have the correct polygon right away
      context.queryClient?.setQueryData(["user", "plots"], (oldPlots: Plot[] | undefined) => {
        if (!oldPlots) return [updatedPlot];
        return oldPlots.map((p) => (p.id === updatedPlot.id ? updatedPlot : p));
      });

      context.queryClient?.invalidateQueries({
        queryKey: ["user", "me"],
      });
      context.queryClient?.invalidateQueries({
        queryKey: ["user", "logs"],
      });
      context.queryClient?.invalidateQueries({
        queryKey: ["plots"],
      });
      // Clear the active action after successful save
      store.trigger.clearClaim();
      setIsOpen(false);
    },
    onError: (error) => {
      if (error instanceof PlotError) {
        Object.entries(error.errors).forEach(([field, messages]) => {
          if (field === "name" || field === "description" || field === "polygon") {
            setError(field, {
              type: "server",
              message: messages[0],
            });
          }
        });

        if (error.errors.general) {
          setError("root", {
            type: "server",
            message: error.errors.general[0],
          });
        }
      } else {
        setError("root", { type: "server", message: error.message });
      }
    },
  });

  const onSubmit = (data: PlotUpdateForm) => {
    const context = store.getSnapshot().context;
    if (isInitialStore(context)) return;

    // Get the modified polygon from the active action if it exists
    let polygon = plot.polygon;
    if (
      context.activeAction?.type === ACTION_TYPES.CLAIMER_EDIT &&
      context.activeAction.plotId === plot.id
    ) {
      polygon = context.activeAction.polygon;
    } else if (
      context.activeAction?.type === ACTION_TYPES.CLAIMER_RESIZE_EDIT &&
      context.activeAction.plotId === plot.id
    ) {
      polygon = context.activeAction.polygon;
    }

    updatePlotMutation({
      plotId: plot.id,
      plot: {
        name: data.name,
        description: data.description,
        polygon,
      },
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      reset({
        name: plot.name,
        description: plot.description,
      });
      // Enter edit mode by starting a resize action
      store.trigger.startEditPlot({ plotId: plot.id });
    } else {
      store.trigger.clearClaim();
    }
  };

  return (
    <Popover type="persistent" open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={(props) => (
          <Button {...props} {...triggerProps}>
            edit
          </Button>
        )}
      />
      <PopoverContent className="w-80 p-2" hideCloseButton={false}>
        <PopoverHeading>Edit Plot</PopoverHeading>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          {errors.polygon && (
            <div className="mb-2 text-sm text-red-600">
              {String(errors.polygon?.message ?? errors.polygon)}
            </div>
          )}
          {errors.root && <div className="mb-2 text-sm text-red-600">{errors.root.message}</div>}

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
            {errors.name && <div className="text-sm text-red-600">{errors.name.message}</div>}
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
              <div className="text-sm text-red-600">{errors.description.message}</div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
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
