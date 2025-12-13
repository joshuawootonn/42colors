"use client";

import { useTopPlots } from "@/lib/plots/plots.rest";

import { PlotsList } from "./plots-list";

type TopPlotsProps = {
  selectedPlotId: number | undefined;
  selectPlot: (plotId: number) => void;
  enabled?: boolean;
};

export function TopPlots({ selectedPlotId, selectPlot, enabled = true }: TopPlotsProps) {
  const {
    data: plots,
    isLoading,
    error,
  } = useTopPlots(100, {
    enabled,
  });

  return (
    <PlotsList
      plots={plots}
      isLoading={isLoading}
      error={error}
      selectedPlotId={selectedPlotId}
      selectPlot={selectPlot}
      emptyMessage="No plots found"
      loadingMessage="Loading top plots..."
    />
  );
}
