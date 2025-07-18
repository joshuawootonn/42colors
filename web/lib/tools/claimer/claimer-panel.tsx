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
import { useQuery } from '@tanstack/react-query';
import { useSelector } from '@xstate/store/react';

import { store } from '../../store';
import { getUserPlots } from './claimer.rest';
import { CreatePlotForm } from './create-plot-form';
import { DeletePlotButton } from './delete-plot-button';
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

    const selectedPlot = useMemo(
        () => plots?.find((plot) => plot.id === selectedPlotId),
        [plots, selectedPlotId],
    );
    const user = useSelector(store, (state) => state.context.user);

    if (user == null) return null;

    return (
        <div className="flex">
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={(props) => (
                        <Button variant="outline" {...props}>
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
                    )}
                />

                <DropdownMenuContent>
                    {plots?.map((plot) => {
                        return (
                            <DropdownMenuItem
                                onClick={() => {
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
                    <CreatePlotForm />
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

                        <DeletePlotButton plot={selectedPlot} />
                    </Tooltip.Provider>
                </>
            ) : null}
        </div>
    );
}
