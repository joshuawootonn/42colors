"use client";

import { getUserPlots, PaginatedPlotsResponse } from "@/lib/tools/claimer/claimer.rest";
import { useInfiniteQuery } from "@tanstack/react-query";

import { PlotsList } from "./plots-list";

const PAGE_SIZE = 20;

interface UserPlotsProps {
  selectedPlotId: number | undefined;
  selectPlot: (plotId: number) => void;
  enabled?: boolean;
  userId?: number;
}

export function UserPlots({ selectedPlotId, selectPlot, enabled = true, userId }: UserPlotsProps) {
  const query = useInfiniteQuery({
    queryKey: ["user", "plots"],
    queryFn: ({ pageParam }) =>
      getUserPlots({ limit: PAGE_SIZE, startingAfter: pageParam as number | undefined }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage: PaginatedPlotsResponse) => {
      if (!lastPage.hasMore || lastPage.data.length === 0) return undefined;
      return lastPage.data[lastPage.data.length - 1].id;
    },
    enabled: enabled && userId != null,
  });

  // Flatten all pages into a single array
  const userPlots = query.data?.pages.flatMap((page) => page.data);

  // If user is not authenticated, show a message encouraging them to create an account
  if (userId == null) {
    return (
      <div className="flex-1 text-pretty pt-20 text-center text-sm text-muted-foreground">
        Create an account to claim a plot
      </div>
    );
  }

  return (
    <PlotsList
      plots={userPlots}
      isLoading={query.isLoading}
      error={query.error}
      selectedPlotId={selectedPlotId}
      selectPlot={selectPlot}
      emptyMessage="No user plots found"
      loadingMessage="Loading user plots..."
      hasNextPage={query.hasNextPage}
      isFetchingNextPage={query.isFetchingNextPage}
      fetchNextPage={query.fetchNextPage}
    />
  );
}
