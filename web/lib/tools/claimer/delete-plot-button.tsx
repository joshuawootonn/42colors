import { ComponentPropsWithoutRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { invalidatePlotById, invalidateUserPlotCaches } from "@/lib/plots/plots.rest";
import { useMutation } from "@tanstack/react-query";

import { store } from "../../store";
import { type Plot, deletePlot } from "./claimer.rest";

interface DeletePlotButtonProps {
  plot: Plot;
  triggerProps?: ComponentPropsWithoutRef<"button">;
}

export function DeletePlotButton({ plot, triggerProps }: DeletePlotButtonProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { mutate: deleteSelectedPlot, isPending } = useMutation({
    mutationFn: deletePlot,
    onSuccess: () => {
      const context = store.getSnapshot().context;
      if (context.queryClient == null) return;
      invalidateUserPlotCaches(context.queryClient);
      invalidatePlotById(plot.id, context.queryClient, context);
      store.trigger.deselectPlot();
      setIsConfirmOpen(false);
    },
  });

  const handleDelete = () => {
    deleteSelectedPlot(plot.id);
  };

  return (
    <>
      <Button {...triggerProps} onClick={() => setIsConfirmOpen(true)}>
        delete
      </Button>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Plot?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <code className="bg-muted px-1 py-0.5 font-mono text-sm text-black">{plot.name}</code>
              ?
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                {isPending ? "Deleting..." : "Delete"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
