import { toasts } from "@/components/ui/toast";

import { ACTION_TYPES } from "../../action-types";
import { getZoomMultiplier } from "../../camera";
import { getPixelSize } from "../../canvas/canvas";
import { InitializedStore, store } from "../../store";
import { EnqueueObject } from "../../xstate-internal-types";
import { getAbsolutePoint, getCameraOffset, pointsToPixels } from "../brush/brush";
import {
  completeRectangleAction,
  nextRectangleAction,
  startRectangleAction,
} from "./shape-helpers";

function redrawTelegraph(context: InitializedStore) {
  const pixelTelegraphWebGPUManager = context.canvas.pixelTelegraphWebGPUManager;
  if (!pixelTelegraphWebGPUManager) {
    console.error("Telegraph WebGPU manager not available for rectangle telegraph rendering");
    return;
  }

  const pixelSize = getPixelSize(getZoomMultiplier(context.camera));

  if (context.activeAction && context.activeAction.type === ACTION_TYPES.RECTANGLE_ACTIVE) {
    const activeRectAction = context.activeAction;
    const pixels = pointsToPixels(activeRectAction.points, activeRectAction.color_ref);
    pixelTelegraphWebGPUManager.redrawPixels(pixels, {
      xCamera: context.camera.x,
      yCamera: context.camera.y,
      pixelSize,
    });
    return;
  }

  // Otherwise, show cursor preview
  if (context.interaction.cursorPosition == null) {
    return;
  }

  const clientX = context.interaction.cursorPosition.clientX;
  const clientY = context.interaction.cursorPosition.clientY;
  const absolutePoint = getAbsolutePoint(clientX, clientY, context);

  const pixels = pointsToPixels([absolutePoint], context.toolSettings.palette.foregroundColorRef);
  pixelTelegraphWebGPUManager.redrawPixels(pixels, {
    xCamera: context.camera.x,
    yCamera: context.camera.y,
    pixelSize,
  });
}

function onPointerDown(
  e: PointerEvent,
  context: InitializedStore,
  enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
  if (context.user == null) {
    enqueue.effect(() => {
      toasts.loginToUseRectangle({
        label: "Log in",
        onClick: () => {
          window.location.href = "/login";
        },
      });
    });
    return context;
  }

  const startPoint = getAbsolutePoint(e.clientX, e.clientY, context);

  if (e.altKey) {
    return context;
  }

  const color_ref =
    e.button === 2
      ? context.toolSettings.palette.backgroundColorRef
      : context.toolSettings.palette.foregroundColorRef;

  const nextActiveAction = startRectangleAction(
    startPoint,
    color_ref,
    context.toolSettings.line.size,
  );

  enqueue.effect(() => {
    store.trigger.updateCurrentAction({ action: nextActiveAction });
  });
  return context;
}

function onPointerMove(
  e: PointerEvent,
  context: InitializedStore,
  enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
  if (context.activeAction?.type !== ACTION_TYPES.RECTANGLE_ACTIVE) {
    return context;
  }

  const endPoint = getAbsolutePoint(e.clientX, e.clientY, context);
  const constrainToSquare = e.shiftKey;
  const drawFromCenter = e.altKey;

  const nextActiveAction = nextRectangleAction(
    context.activeAction,
    endPoint,
    constrainToSquare,
    drawFromCenter,
  );

  enqueue.effect(() => {
    store.trigger.updateCurrentAction({ action: nextActiveAction });
  });
  return context;
}

function onWheel(
  e: WheelEvent,
  context: InitializedStore,
  enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
  if (context.activeAction?.type !== ACTION_TYPES.RECTANGLE_ACTIVE) {
    return context;
  }

  const endPoint = getAbsolutePoint(e.clientX, e.clientY, context);
  const constrainToSquare = e.shiftKey;
  const drawFromCenter = e.altKey;

  const nextActiveAction = nextRectangleAction(
    context.activeAction,
    endPoint,
    constrainToSquare,
    drawFromCenter,
  );

  enqueue.effect(() => {
    store.trigger.updateCurrentAction({ action: nextActiveAction });
  });
  return context;
}

function onPointerOut(
  _: PointerEvent,
  context: InitializedStore,
  enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
  if (context.activeAction?.type !== ACTION_TYPES.RECTANGLE_ACTIVE) {
    return context;
  }

  const action_id = context.activeAction.action_id;
  const rectangleComplete = completeRectangleAction(context.activeAction);

  enqueue.effect(() => {
    store.trigger.completeCurrentAction({ action: rectangleComplete });
    store.trigger.newPixels({
      pixels: pointsToPixels(rectangleComplete.points, rectangleComplete.color_ref),
      action_id,
    });
  });

  return context;
}

function onPointerUp(
  _: PointerEvent,
  context: InitializedStore,
  enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
  if (context.activeAction?.type !== ACTION_TYPES.RECTANGLE_ACTIVE) {
    return context;
  }

  const action_id = context.activeAction.action_id;
  const completedAction = completeRectangleAction(context.activeAction);

  enqueue.effect(() => {
    store.trigger.completeCurrentAction({ action: completedAction });
    store.trigger.newPixels({
      pixels: pointsToPixels(completedAction.points, completedAction.color_ref),
      action_id,
    });
  });

  return context;
}

export const RectangleTool = {
  onPointerMove,
  onPointerDown,
  onPointerUp,
  onPointerOut,
  onWheel,
  redrawTelegraph,
};

export type RectangleTool = typeof RectangleTool;
