import { useMemo } from 'react';

import { X } from '@/components/icons/x';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconButton } from '@/components/ui/icon-button';
import * as Tooltip from '@/components/ui/tooltip';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSelector } from '@xstate/store/react';

import { store } from '../../store';
import { deletePlot, getUserPlots } from './claimer.rest';
import { CreatePlotForm } from './create-plot-form';
import { EditPlotForm } from './edit-plot-form';

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
        queryKey: ['user', 'plots'],
        queryFn: getUserPlots,
    });

    const { mutate: deleteSelectedPlot } = useMutation({
        mutationFn: deletePlot,
        onSuccess: () => {
            store.getSnapshot().context.queryClient?.invalidateQueries({
                queryKey: ['user', 'plots'],
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
                        {activeAction?.type === 'claimer-active' ? (
                            'New Claim'
                        ) : selectedPlot ? (
                            selectedPlot.name
                        ) : (
                            <>
                                Select Plot{' '}
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
                                    store.trigger.selectPlot({
                                        plotId: plot.id,
                                    });
                                }}
                                key={plot.id}
                            >
                                {plot.name}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
            {activeAction?.type === 'claimer-active' ? (
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
    return (
        <div className="flex flex-col items-start justify-start">
            <CreatePlotForm />
        </div>
    );
}
