import { getPlot } from '@/lib/plots/plots.rest';
import { store } from '@/lib/store';
import { skipToken, useQuery } from '@tanstack/react-query';
import { useSelector } from '@xstate/store/react';

import { Plot } from './claimer.rest';

export function useSelectedPlot(): Plot | null {
    const selectedPlotId = useSelector(
        store,
        (state) => state.context.toolSettings?.claimer.selectedPlotId,
    );

    const { data: selectedPlot } = useQuery({
        queryKey: ['plots', selectedPlotId],
        queryFn: selectedPlotId ? () => getPlot(selectedPlotId) : skipToken,
    });

    return selectedPlot?.status === 'found' ? selectedPlot.plot : null;
}
