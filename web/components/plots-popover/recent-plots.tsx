"use client";

import { useRecentPlots } from "@/lib/plots/plots.rest";

import { PlotsList } from "./plots-list";

const PAGE_SIZE = 20;

interface RecentPlotsProps {
  selectedPlotId: number | undefined;
  selectPlot: (plotId: number) => void;
  enabled?: boolean;
}

export function RecentPlots({ selectedPlotId, selectPlot, enabled = true }: RecentPlotsProps) {
  const { data: plots, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useRecentPlots(PAGE_SIZE, {
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
      loadingMessage="Loading plots..."
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
    />
  );
}
