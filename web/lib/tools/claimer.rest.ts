import { z } from "zod";
import {
  completePolygonRing,
  getCompositePolygons,
  polygonSchema,
  rectToPolygonSchema,
} from "../polygon";
import { store } from "../store";
import { isInitialStore } from "../utils/is-initial-store";
import { completeRectangleClaimerAction } from "./claimer";

const plotSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  polygon: polygonSchema,
  insertedAt: z.string(),
  updatedAt: z.string(),
});

type Plot = z.infer<typeof plotSchema>;

export async function createPlot(): Promise<Plot> {
  const context = store.getSnapshot().context;
  if (
    isInitialStore(context) ||
    context.activeAction?.type !== "claimer-active"
  ) {
    throw new Error(
      "Attempted to create a plot when there isn't an active action",
    );
  }

  const rects = [...context.activeAction.rects];
  if (context.activeAction.nextRect != null) {
    rects.push(context.activeAction.nextRect);
  }
  const polygons = completeRectangleClaimerAction(
    getCompositePolygons(rects.map((rect) => rectToPolygonSchema.parse(rect))),
  ).polygons;

  const response = await fetch(
    new URL(`/api/plots`, context.server.apiOrigin),
    {
      body: JSON.stringify({
        plot: {
          name: `Test Plot ${Date.now()}`,
          description: `Test Description ${Date.now()}`,
          // todo(josh): we should add some sort of notice to the user that only their first polygon is going to be used
          polygon: completePolygonRing(polygons[0]),
        },
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      credentials: "include",
    },
  );

  const json = await response.json();
  const plot = plotSchema.parse(json);

  return plot;
}

export async function getUserPlots(): Promise<Plot[]> {
  const context = store.getSnapshot().context;
  if (isInitialStore(context)) {
    throw new Error("Server context is not initialized");
  }

  const response = await fetch(
    new URL(`/api/plots`, context.server.apiOrigin),
    {
      method: "GET",
      credentials: "include",
    },
  );

  const json = await response.json();

  return z.object({ data: z.array(plotSchema) }).parse(json).data;
}
