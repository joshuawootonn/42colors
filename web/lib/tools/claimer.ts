import { InitializedStore, store } from "../store";
import { getCanvasXY } from "./brush";
import { EnqueueObject } from "../xstate-internal-types";
import { Point, pointSchema } from "../coord";
import { canvasToClient } from "../utils/clientToCanvasConversion";

function redrawTelegraph(context: InitializedStore) {
  const ctx = context.canvas.telegraphCanvasContext;
  const canvas = context.canvas.telegraphCanvas;

  if (context.activeAction?.type !== "claimer-active") {
    return context;
  }

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "yellow";

  const o = context.activeAction.origin;
  const t = context.activeAction.target;

  const origin = pointSchema.parse({
    x: canvasToClient(o.x, context.camera.zoom),
    y: canvasToClient(o.y, context.camera.zoom),
    camera: context.camera,
  });
  const target = pointSchema.parse({
    x: canvasToClient(t.x, context.camera.zoom),
    y: canvasToClient(t.y, context.camera.zoom),
    camera: context.camera,
  });
  ctx.beginPath();
  ctx.lineWidth = 6;
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(target.x, origin.y);
  ctx.lineTo(target.x, target.y);
  ctx.lineTo(origin.x, target.y);
  ctx.lineTo(origin.x, origin.y);
  ctx.stroke();
}

export type ClaimerActive = {
  type: "claimer-active";
  origin: Point;
  target: Point;
};

export function startClaimerAction(point: Point): ClaimerActive {
  return {
    type: "claimer-active",
    origin: point,
    target: point,
  };
}

export function nextClaimerAction(
  activeBrushAction: ClaimerActive,
  target: Point,
): ClaimerActive {
  return {
    ...activeBrushAction,
    target,
  };
}

function onPointerDown(
  e: PointerEvent,
  context: InitializedStore,
  enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
  const { canvasX, canvasY } = getCanvasXY(e.clientX, e.clientY, context);

  const point = pointSchema.parse({
    x: canvasX,
    y: canvasY,
    camera: context.camera,
  });

  const nextActiveAction = startClaimerAction(point);

  enqueue.effect(() => {
    store.trigger.redrawRealtimeCanvas();
  });
  return {
    ...context,
    activeAction: nextActiveAction,
  };
}

function onPointerMove(
  e: PointerEvent,
  context: InitializedStore,
  enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
  const { canvasX, canvasY } = getCanvasXY(e.clientX, e.clientY, context);

  if (context.activeAction?.type !== "claimer-active") {
    return context;
  }

  const point = pointSchema.parse({
    x: canvasX,
    y: canvasY,
    camera: context.camera,
  });
  const nextActiveAction = nextClaimerAction(context.activeAction, point);
  enqueue.effect(() => {
    store.trigger.redrawRealtimeCanvas();
  });

  return {
    ...context,
    activeAction: nextActiveAction,
  };
}

function onWheel(
  e: WheelEvent,
  context: InitializedStore,
  enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
  const { canvasX, canvasY } = getCanvasXY(e.clientX, e.clientY, context);

  if (context.activeAction?.type !== "claimer-active") {
    return context;
  }

  const point = pointSchema.parse({
    x: canvasX,
    y: canvasY,
    camera: context.camera,
  });
  const nextActiveAction = nextClaimerAction(context.activeAction, point);
  enqueue.effect(() => {
    store.trigger.redrawRealtimeCanvas();
  });

  return {
    ...context,
    activeAction: nextActiveAction,
  };
}

function onPointerOut(
  _: PointerEvent,
  context: InitializedStore,
  __: EnqueueObject<{ type: string }>,
): InitializedStore {
  if (context.activeAction?.type !== "claimer-active") return context;

  return {
    ...context,
    activeAction: null,
    actions: context.actions.concat(context.activeAction),
  };
}

function onPointerUp(
  _: PointerEvent,
  context: InitializedStore,
  __: EnqueueObject<{ type: string }>,
): InitializedStore {
  if (context.activeAction?.type !== "claimer-active") return context;

  return {
    ...context,
    activeAction: null,
    actions: context.actions.concat(context.activeAction),
  };
}

export const ClaimerTool = {
  onPointerMove,
  onPointerDown,
  onPointerUp,
  onPointerOut,
  onWheel,
  redrawTelegraph,
};

export type ClaimerTool = typeof ClaimerTool;
