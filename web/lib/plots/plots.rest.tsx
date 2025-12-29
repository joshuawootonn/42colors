import { InitializedStore, store } from "@/lib/store";
import { isInitialStore } from "@/lib/utils/is-initial-store";
import { QueryClient, UseQueryOptions, useQuery } from "@tanstack/react-query";

import { getChunkKey, getChunkOrigin } from "../canvas/chunk";
import { inside, Polygon } from "../geometry/polygon";
import { polygonSchema } from "../geometry/polygon";
import { AbsolutePointTuple } from "../line";
import { Plot, arrayPlotResponseSchema, plotResponseSchema } from "../tools/claimer/claimer.rest";

// ============================================================================
// Cache Invalidation Helpers
// ============================================================================

function getChunkKeysForPolygon(polygon: Polygon): string[] {
  const chunkKeys = new Set<string>();
  for (const vertex of polygon.vertices) {
    chunkKeys.add(getChunkKey(vertex[0], vertex[1]));
  }
  return Array.from(chunkKeys);
}

export function invalidateUserPlotCaches(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["user", "plots"] });
  queryClient.invalidateQueries({ queryKey: ["user", "me"] });
  queryClient.invalidateQueries({ queryKey: ["user", "logs"] });
}

export function invalidateRecentPlots(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["plots", "list"] });
}

export function invalidatePlotChunks(queryClient: QueryClient, polygon: Polygon) {
  const chunkKeys = getChunkKeysForPolygon(polygon);
  for (const chunkKey of chunkKeys) {
    queryClient.invalidateQueries({ queryKey: ["plots", chunkKey] });
  }
}

export function invalidatePlotById(
  plotId: number,
  queryClient: QueryClient,
  context: InitializedStore,
) {
  // Invalidate the individual plot query (used by useSelectedPlot)
  queryClient.invalidateQueries({ queryKey: ["plots", plotId] });

  // Check if plot is in user plots
  const userPlots = (queryClient.getQueryData(["user", "plots"]) ?? []) as Plot[];
  if (userPlots.some((plot) => plot.id === plotId)) {
    queryClient.invalidateQueries({ queryKey: ["user", "plots"] });
  }

  // Check if plot is in recent plots
  const recentPlots = (queryClient.getQueryData(["plots", "list"]) ?? []) as Plot[];
  if (recentPlots.some((plot) => plot.id === plotId)) {
    queryClient.invalidateQueries({ queryKey: ["plots", "list"] });
  }

  // Check if plot is in top plots
  const topPlots = (queryClient.getQueryData(["plots", "top"]) ?? []) as Plot[];
  if (topPlots.some((plot) => plot.id === plotId)) {
    queryClient.invalidateQueries({ queryKey: ["plots", "top"] });
  }

  // Check chunk caches for this plot
  for (const chunkKey in context.canvas.chunkCanvases) {
    const chunk = context.canvas.chunkCanvases[chunkKey];
    if (chunk?.plots?.some((plot) => plot.id === plotId)) {
      queryClient.invalidateQueries({ queryKey: ["plots", chunkKey] });
    }
  }
}

type GetPlotOptions = {
  include_deleted?: boolean;
};

export async function getPlot(id: number, options: GetPlotOptions = {}): Promise<Plot> {
  const context = store.getSnapshot().context;
  if (isInitialStore(context)) {
    throw new Error("Server context is not initialized");
  }

  const search = new URLSearchParams();
  if (options.include_deleted) {
    search.set("include_deleted", "true");
  }

  const url = new URL(`/api/plots/${id}`, context.server.apiOrigin);
  if (search.toString()) {
    url.search = search.toString();
  }

  const response = await fetch(url, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch plot");
  }

  const json = await response.json();
  const plot = plotResponseSchema.parse(json).data;

  return plot;
}

type GetPlotsOptions = {
  limit?: number;
  order_by?: "recent" | "top";
};

export async function getPlots(options: GetPlotsOptions = {}): Promise<Plot[]> {
  const context = store.getSnapshot().context;
  if (isInitialStore(context)) {
    throw new Error("Server context is not initialized");
  }

  const search = new URLSearchParams();
  if (options.limit != null) search.set("limit", options.limit.toString());
  if (options.order_by != null) search.set("order_by", options.order_by);

  const response = await fetch(new URL(`/api/plots?${search}`, context.server.apiOrigin), {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch plots");
  }

  const json = await response.json();

  return arrayPlotResponseSchema.parse(json).data;
}

export function useRecentPlots(
  limit: number = 20,
  queryOptions?: Omit<UseQueryOptions<Plot[], Error>, "queryKey" | "queryFn">,
) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["plots", "list"],
    queryFn: () => getPlots({ limit }),
    ...queryOptions,
  });

  return { data, isLoading, error };
}

export function useTopPlots(
  limit: number = 20,
  queryOptions?: Omit<UseQueryOptions<Plot[], Error>, "queryKey" | "queryFn">,
) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["plots", "top"],
    queryFn: () => getPlots({ limit, order_by: "top" }),
    ...queryOptions,
  });

  return { data, isLoading, error };
}

// ============================================================================
// Local Plot Lookup (chunk plots only - synchronous)
// ============================================================================

/**
 * Finds a plot at the given point from locally loaded chunk plots.
 * Only checks plots that have been loaded into memory for visible chunks.
 */
export function findPlotAtPoint(point: AbsolutePointTuple, context: InitializedStore): Plot | null {
  const chunkKey = getChunkKey(point[0], point[1]);
  const chunk = context.canvas.chunkCanvases[chunkKey];
  if (chunk && chunk.plots) {
    const chunkOrigin = getChunkOrigin(point[0], point[1]);
    for (const plot of chunk.plots) {
      if (plot.polygon) {
        // Convert chunk-local polygon back to world coordinates
        const worldPolygon = polygonSchema.parse({
          vertices: plot.polygon.vertices.map((vertex) => [
            vertex[0] + chunkOrigin.x,
            vertex[1] + chunkOrigin.y,
          ]),
        });
        if (inside(point, worldPolygon)) {
          return {
            ...plot,
            polygon: worldPolygon,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Finds a plot by ID from locally loaded chunk plots.
 * Only checks plots that have been loaded into memory for visible chunks.
 */
export function findPlotById(id: number, context: InitializedStore): Plot | null {
  for (const chunkKey in context.canvas.chunkCanvases) {
    const chunk = context.canvas.chunkCanvases[chunkKey];
    if (chunk && chunk.plots) {
      for (const plot of chunk.plots) {
        if (plot.id === id) {
          if (plot.polygon) {
            // Convert chunk-local polygon back to world coordinates
            return {
              ...plot,
              polygon: polygonSchema.parse({
                vertices: plot.polygon.vertices.map((vertex) => [
                  vertex[0] + chunk.x,
                  vertex[1] + chunk.y,
                ]),
              }),
            };
          }
          return plot;
        }
      }
    }
  }

  return null;
}

// ============================================================================
// Remote Plot Search (API calls - async)
// ============================================================================

/**
 * Searches for a plot at the given point via API call.
 * Use this when findPlotAtPoint returns null but you need to check the server.
 */
export async function searchPlotAtPoint(x: number, y: number): Promise<Plot | null> {
  const context = store.getSnapshot().context;
  if (isInitialStore(context)) {
    throw new Error("Server context is not initialized");
  }

  const search = new URLSearchParams();
  search.set("x", x.toString());
  search.set("y", y.toString());

  const response = await fetch(new URL(`/api/plots/search?${search}`, context.server.apiOrigin), {
    method: "GET",
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error("Failed to search for plot");
  }

  const json = await response.json();
  return plotResponseSchema.parse(json).data;
}

/**
 * Searches for a plot by ID via API call (alias for getPlot).
 * Use this when findPlotById returns null but you need to check the server.
 */
export async function searchPlotById(id: number): Promise<Plot | null> {
  try {
    return await getPlot(id);
  } catch {
    return null;
  }
}
