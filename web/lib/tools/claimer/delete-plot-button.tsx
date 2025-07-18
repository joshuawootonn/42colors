import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { IconButton } from '@/components/ui/icon-button';
import * as Tooltip from '@/components/ui/tooltip';
import { useMutation } from '@tanstack/react-query';

import { store } from '../../store';
import { type Plot, deletePlot } from './claimer.rest';

interface DeletePlotButtonProps {
    plot: Plot;
}

export function DeletePlotButton({ plot }: DeletePlotButtonProps) {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const { mutate: deleteSelectedPlot, isPending } = useMutation({
        mutationFn: deletePlot,
        onSuccess: () => {
            store.getSnapshot().context.queryClient?.invalidateQueries({
                queryKey: ['user', 'plots'],
            });
            store.trigger.redrawRealtimeCanvas();
            store.trigger.deselectPlot();
            setIsConfirmOpen(false);
        },
    });

    const handleDelete = () => {
        deleteSelectedPlot(plot.id);
    };

    return (
        <>
            <Tooltip.Root>
                <Tooltip.Trigger>
                    <IconButton
                        className="text-black -translate-x-[2px]"
                        onClick={() => setIsConfirmOpen(true)}
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

            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Plot?</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Are you sure you want to delete{' '}
                            <code className="bg-muted text-black px-1 py-0.5 text-sm font-mono">
                                {plot.name}
                            </code>
                            ?
                        </p>
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsConfirmOpen(false)}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isPending}
                            >
                                {isPending ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
