import { z } from "zod";
import {
  completePolygonRing,
  getCompositePolygons,
  Polygon,
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
  polygons: polygonSchema,
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

  const jsonBlob = await response.json();
  const plot = plotSchema.parse(jsonBlob);

  console.log(plot);

  return plot;
}
