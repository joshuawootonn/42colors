import isHotkey from "is-hotkey";
import { Channel, Socket } from "phoenix";

import { toasts } from "@/components/ui/toast";
import { QueryClient } from "@tanstack/react-query";
import { createStore } from "@xstate/store";

import { ACTION_TYPES } from "./action-types";
import {
  Action,
  EditableAction,
  Redo,
  Undo,
  derivePixelsFromActions,
  getActionToRedo,
  getActionToUndo,
  isEditableAction,
  resolveActions,
  updateActionBasedOnRejectedPixels,
} from "./actions";
import { isAdminUser } from "./admin";
import authService from "./auth";
import { Camera } from "./camera";
import { centerCameraOnPoint } from "./camera-utils";
import { drawBackgroundCanvas, resizeBackgroundCanvas } from "./canvas/background";
import { getCameraCenterPoint } from "./canvas/canvas";
import { Chunk, ChunkCanvases, getChunkKey, getUniqueChunksFromPixels } from "./canvas/chunk";
import { draw } from "./canvas/draw";
import { resizeFullsizeCanvas } from "./canvas/fullsize";
import { showCrosshair } from "./canvas/ui";
import {
  CHUNK_LENGTH,
  X_MAX,
  X_MIN,
  Y_MAX,
  Y_MIN,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_MIN_ADMIN,
} from "./constants";
import {
  onContextMenu,
  onGesture,
  onKeyDown,
  onKeyUp,
  onPointerDown,
  onPointerMove,
  onPointerOut,
  onPointerUp,
  onResize,
  onTouch,
  onWheel,
} from "./events";
import { fetchPixels } from "./fetch-pixels";
import { bresenhamLine } from "./geometry/bresenham-line";
import { Pixel, getLastPixelValue } from "./geometry/coord";
import { getCenterPoint, polygonSchema } from "./geometry/polygon";
import { KeyboardCode } from "./keyboard-codes";
import { absolutePointTupleToPixels } from "./line";
import { TRANSPARENT_REF, getNextColor, getPreviousColor } from "./palette";
import { findPlotAtPoint, findPlotById, getPlot } from "./plots/plots.rest";
import { roundTo1Place } from "./round-to-five";
import { newPixels, setupChannel, setupSocketConnection } from "./sockets";
import { DEFAULT_TOOL_SETTINGS, Tool, ToolSettings, updateToolSettings } from "./tool-settings";
import { BrushSettings, BrushTool, getBrushPoints, pointsToPixels } from "./tools/brush/brush";
import { clampBrushSize } from "./tools/brush/brush-utils";
import { BucketTool } from "./tools/bucket/bucket";
import {
  ClaimerTool,
  completeRectangleClaimerAction,
  startEditAction,
} from "./tools/claimer/claimer";
import { getPlotsByChunk, getUserPlots } from "./tools/claimer/claimer.rest";
import { ErasureSettings, ErasureTool } from "./tools/erasure/erasure";
import { clampErasureSize } from "./tools/erasure/erasure-utils";
import { EyedropperTool } from "./tools/eyedropper/eyedropper";
import { LineSettings, LineTool } from "./tools/line/line";
import { clampLineSize } from "./tools/line/line-utils";
import { PaletteSettings } from "./tools/palette";
import { MoveTool } from "./tools/move";
import { WheelTool } from "./tools/wheel";
import { RectangleTool } from "./tools/shape/rectangle";
import { RectangleFillTool } from "./tools/shape/rectangle-fill";
import { EllipseTool } from "./tools/shape/ellipse";
import { EllipseFillTool } from "./tools/shape/ellipse-fill";
import { ShapePickerSettings } from "./tools/shape/shape-picker-settings";
import { clamp } from "./utils/clamp";
import { isInitialStore } from "./utils/is-initial-store";
import { uuid } from "./utils/uuid";
import { WebGPUManager } from "./webgpu/web-gpu-manager";

type AdminSettings = {
  plotBordersVisible: boolean;
  chunkBordersVisible: boolean;
  isAdminCanvasEditingEnabled: boolean;
  isAdminPlotEditingEnabled: boolean;
  isAdminZoomEnabled: boolean;
};

export type InitialStore = {
  state: "initial";
  camera: Camera;
  currentTool: Tool;
  currentColorRef: number;
  toolSettings: ToolSettings;
  adminSettings: AdminSettings;
  id: undefined;
  interaction: undefined;
  queryClient: undefined;
  user: undefined;
  activeAction: undefined;
};

export type InitializedStore = {
  state: "initialized";
  camera: Camera;
  adminSettings: AdminSettings;
  server: {
    apiOrigin: string;
    websocketOriginURL: string;
    authURL?: string;
    socket?: Socket;
    channel?: Channel;
  };
  toolSettings: ToolSettings;
  id: string;
  canvas: {
    bodyElement: HTMLBodyElement;
    rootCanvas: HTMLCanvasElement;
    rootCanvasContext: CanvasRenderingContext2D;
    backgroundCanvas: HTMLCanvasElement;
    backgroundCanvasContext: CanvasRenderingContext2D;
    pixelTelegraphCanvas: HTMLCanvasElement;
    uiTelegraphCanvas: HTMLCanvasElement;
    uiCanvas: HTMLCanvasElement;
    chunkCanvases: ChunkCanvases;
    uiWebGPUManager: WebGPUManager;
    pixelTelegraphWebGPUManager: WebGPUManager;
    uiTelegraphWebGPUManager: WebGPUManager;
    device: GPUDevice;
  };
  actions: Action[];
  activeAction: Action | null;
  interaction: {
    isPressed: boolean;
    isSpacePressed: boolean;
    isAltPressed: boolean;
    previousTool: Tool | null;
    cursorPosition: { clientX: number; clientY: number } | null;
  };
  user?: {
    email: string;
    id: number;
    balance: number;
    channel_token: string;
  } | null;
  queryClient: QueryClient;
  eventLoopRafId?: number;
};

export type Store = InitialStore | InitializedStore;

const initialCamera: Camera = {
  x: 0,
  y: 0,
  zoom: process.env.NODE_ENV === "development" ? 500 : 100,
};

const defaultAdminSettings: AdminSettings = {
  plotBordersVisible: true,
  chunkBordersVisible: true,
  isAdminCanvasEditingEnabled: false,
  isAdminPlotEditingEnabled: false,
  isAdminZoomEnabled: false,
};

const initialialStoreContext: Store = {
  id: undefined,
  state: "initial",
  camera: initialCamera,
  currentTool: "brush",
  currentColorRef: 1,
  toolSettings: DEFAULT_TOOL_SETTINGS,
  adminSettings: defaultAdminSettings,
  interaction: undefined,
} as Store;

function getChunkKeysFromAction(action: Action): string[] {
  if ("chunkKeys" in action && Array.isArray(action.chunkKeys)) {
    return action.chunkKeys;
  }
  return [];
}

export const store = createStore({
  context: initialialStoreContext,
  on: {
    //////////////// General store /////////////////
    initializeStore: (
      context,
      event: {
        body: HTMLBodyElement;
        canvas: HTMLCanvasElement;
        apiOrigin: string;
        apiWebsocketOrigin: string;
        queryClient: QueryClient;
        cameraOptions: Camera;
        toolSettings: ToolSettings;
        rootCanvasContext: CanvasRenderingContext2D;
        backgroundCanvas: HTMLCanvasElement;
        backgroundCanvasContext: CanvasRenderingContext2D;
        pixelTelegraphCanvas: HTMLCanvasElement;
        uiTelegraphCanvas: HTMLCanvasElement;
        uiCanvas: HTMLCanvasElement;
        uiWebGPUManager: WebGPUManager;
        pixelTelegraphWebGPUManager: WebGPUManager;
        uiTelegraphWebGPUManager: WebGPUManager;
        device: GPUDevice;
      },
      enqueue,
    ) => {
      if (!isInitialStore(context)) return;

      enqueue.effect(() => {
        store.trigger.fetchPixels();
        store.trigger.fetchUser();

        // todo(josh): why is this different?
        event.queryClient.fetchQuery({
          queryKey: ["user", "plots"],
          queryFn: () => getUserPlots(),
        });
      });

      const initialized: InitializedStore = {
        ...context,
        state: "initialized" as const,
        id: uuid(),
        camera: {
          ...context.camera,
          x: event.cameraOptions.x,
          y: event.cameraOptions.y,
          zoom: event.cameraOptions.zoom,
        },
        adminSettings: { ...context.adminSettings },
        server: {
          apiOrigin: event.apiOrigin,
          websocketOriginURL: event.apiWebsocketOrigin,
        },
        toolSettings: event.toolSettings,
        interaction: {
          isPressed: false,
          isSpacePressed: false,
          isAltPressed: false,
          previousTool: null,
          cursorPosition: null,
        },
        actions: [],
        activeAction: null,
        canvas: {
          bodyElement: event.body,
          rootCanvas: event.canvas,
          rootCanvasContext: event.rootCanvasContext,
          backgroundCanvas: event.backgroundCanvas,
          backgroundCanvasContext: event.backgroundCanvasContext,
          pixelTelegraphCanvas: event.pixelTelegraphCanvas,
          uiTelegraphCanvas: event.uiTelegraphCanvas,
          uiCanvas: event.uiCanvas,
          chunkCanvases: {},
          uiWebGPUManager: event.uiWebGPUManager,
          pixelTelegraphWebGPUManager: event.pixelTelegraphWebGPUManager,
          uiTelegraphWebGPUManager: event.uiTelegraphWebGPUManager,
          device: event.device,
        },
        queryClient: event.queryClient,
      };

      return initialized;
    },

    listen: (
      _context,
      { element, body }: { element: HTMLCanvasElement; body: HTMLBodyElement },
    ) => {
      element.addEventListener("wheel", onWheel);
      body.addEventListener("keydown", onKeyDown);
      body.addEventListener("keyup", onKeyUp);
      window.addEventListener("resize", onResize);
      element.addEventListener("pointermove", onPointerMove);
      element.addEventListener("pointerdown", onPointerDown);
      element.addEventListener("pointerup", onPointerUp);
      element.addEventListener("pointerout", onPointerOut);
      element.addEventListener("contextmenu", onContextMenu);

      body.addEventListener("touchstart", onTouch, true);
      body.addEventListener("touchmove", onTouch, true);

      body.addEventListener("gesturestart", onGesture, true);
      body.addEventListener("gesturemove", onGesture, true);
      body.addEventListener("gestureend", onGesture, true);
    },

    unlisten: (
      context,
      { element, body }: { element: HTMLCanvasElement; body: HTMLBodyElement },
    ) => {
      element.removeEventListener("wheel", onWheel);
      body.removeEventListener("keydown", onKeyDown);
      body.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", onResize);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointerout", onPointerOut);

      body.removeEventListener("touchstart", onTouch, true);
      body.removeEventListener("touchmove", onTouch, true);

      body.removeEventListener("gesturestart", onGesture, true);
      body.removeEventListener("gesturemove", onGesture, true);
      body.removeEventListener("gestureend", onGesture, true);

      if (!isInitialStore(context)) {
        Object.values(context.canvas.chunkCanvases).forEach((chunk) => {
          chunk.destroy();
        });
      }
    },

    reconnectToSocket: (
      context,
      event: {
        channel_token?: string;
      },
    ) => {
      if (isInitialStore(context)) return;
      const socket = setupSocketConnection(context.server.websocketOriginURL, event.channel_token);
      const channel = setupChannel(socket);

      return {
        ...context,
        server: {
          ...context.server,
          socket,
          channel,
        },
      };
    },

    draw: (context) => {
      if (isInitialStore(context)) return;
      draw(context);
    },

    resizeRealtimeAndTelegraphCanvases: (context) => {
      if (isInitialStore(context)) return;
      resizeFullsizeCanvas(context.canvas.pixelTelegraphCanvas);
      resizeFullsizeCanvas(context.canvas.uiTelegraphCanvas);
      resizeFullsizeCanvas(context.canvas.uiCanvas);
    },

    //////////////// User events /////////////////

    setUser: (
      context,
      event: {
        user: {
          email: string;
          id: number;
          balance: number;
          channel_token: string;
        } | null;
      },
    ) => {
      if (isInitialStore(context)) return;
      return {
        ...context,
        user: event.user,
      };
    },

    fetchUser: (context, _, enqueue) => {
      if (isInitialStore(context)) return;
      enqueue.effect(() =>
        context.queryClient
          .fetchQuery({
            queryKey: ["user", "me"],
            queryFn: () => authService.getCurrentUser(context.server.apiOrigin),
          })
          .then((json) => {
            store.trigger.setUser({
              user: json ? json.user : null,
            });
            store.trigger.reconnectToSocket({
              channel_token: json?.user.channel_token,
            });
          }),
      );
    },

    setAuthURL: (context, { authURL }: { authURL: string }) => {
      if (isInitialStore(context)) return;
      return {
        ...context,
        server: { ...context.server, authURL },
      };
    },

    //////////////// Collaboration events /////////////////

    undo: (context, _, enqueue) => {
      if (isInitialStore(context)) return;

      const actionToUndo = getActionToUndo(context.actions);

      const nextAction: Undo = {
        type: "undo" as const,
        chunkKeys: actionToUndo?.chunkKeys ?? [],
      };
      const nextActions = context.actions.concat(nextAction);

      if (actionToUndo == null) {
        enqueue.effect(() => {
          store.trigger.addAction({ action: nextAction });
        });
        return context;
      }

      let pixels: Pixel[];
      if (actionToUndo.type === ACTION_TYPES.LINE_COMPLETE) {
        const linePoints = bresenhamLine(
          actionToUndo.vector.x,
          actionToUndo.vector.y,
          actionToUndo.vector.x + actionToUndo.vector.magnitudeX,
          actionToUndo.vector.y + actionToUndo.vector.magnitudeY,
        );
        const brushPoints = getBrushPoints(linePoints, actionToUndo.size, 1);
        pixels = pointsToPixels(brushPoints, actionToUndo.color_ref);
      } else if (actionToUndo.type === ACTION_TYPES.BUCKET_ACTIVE) {
        pixels = absolutePointTupleToPixels(actionToUndo.points, actionToUndo.color_ref);
      } else {
        pixels = pointsToPixels(
          actionToUndo.points,
          actionToUndo.type === ACTION_TYPES.ERASURE_ACTIVE
            ? TRANSPARENT_REF
            : actionToUndo.color_ref,
        );
      }

      const resolvedActions = resolveActions(nextActions);
      const resolvedPixels = derivePixelsFromActions(resolvedActions);
      const next: Pixel[] = [];
      for (let i = 0; i < pixels.length; i++) {
        const pixel = pixels[i];
        const lastPixelValue =
          getLastPixelValue(resolvedPixels, pixel) ??
          context.canvas.chunkCanvases[getChunkKey(pixel.x, pixel.y)]?.getPixelValue(
            pixel.x,
            pixel.y,
          ) ??
          ({
            x: pixel.x,
            y: pixel.y,
            color_ref: 0,
          } as Pixel);
        next.push(lastPixelValue);
      }

      newPixels(context, next);

      enqueue.effect(() => {
        store.trigger.addAction({ action: nextAction });
      });
      return context;
    },

    redo: (context, _, enqueue) => {
      if (isInitialStore(context)) return;

      const actionToRedo = getActionToRedo(context.actions);
      const nextAction: Redo = {
        type: "redo" as const,
        chunkKeys: actionToRedo?.chunkKeys ?? [],
      };

      const nextActions = context.actions.concat(nextAction);

      if (actionToRedo == null) {
        enqueue.effect(() => {
          store.trigger.addAction({ action: nextAction });
        });
        return context;
      }

      let pixels: Pixel[];
      if (actionToRedo.type === ACTION_TYPES.LINE_COMPLETE) {
        const linePoints = bresenhamLine(
          actionToRedo.vector.x,
          actionToRedo.vector.y,
          actionToRedo.vector.x + actionToRedo.vector.magnitudeX,
          actionToRedo.vector.y + actionToRedo.vector.magnitudeY,
        );
        const brushPoints = getBrushPoints(linePoints, actionToRedo.size, 1);
        pixels = pointsToPixels(brushPoints, actionToRedo.color_ref);
      } else if (actionToRedo.type === ACTION_TYPES.BUCKET_ACTIVE) {
        pixels = absolutePointTupleToPixels(actionToRedo.points, actionToRedo.color_ref);
      } else {
        pixels = pointsToPixels(
          actionToRedo.points,
          actionToRedo.type === ACTION_TYPES.ERASURE_ACTIVE
            ? TRANSPARENT_REF
            : actionToRedo.color_ref,
        );
      }

      const resolvedActions = resolveActions(nextActions);
      const resolvedPixels = derivePixelsFromActions(resolvedActions);
      const next: Pixel[] = [];
      for (let i = 0; i < pixels.length; i++) {
        const pixel = pixels[i];
        const lastPixelValue =
          getLastPixelValue(resolvedPixels, pixel) ??
          context.canvas.chunkCanvases[getChunkKey(pixel.x, pixel.y)]?.getPixelValue(
            pixel.x,
            pixel.y,
          ) ??
          ({
            x: pixel.x,
            y: pixel.y,
            color_ref: 0,
          } as Pixel);
        next.push(lastPixelValue);
      }

      newPixels(context, next);

      enqueue.effect(() => {
        store.trigger.addAction({ action: nextAction });
      });
      return context;
    },

    //////////////// Chunk events /////////////////

    chunkOp: (
      context,
      event: {
        chunkKey: string;
        operation: (chunk: Chunk) => void;
      },
    ) => {
      if (isInitialStore(context)) return;

      const chunk = context.canvas.chunkCanvases[event.chunkKey];
      if (!chunk) {
        throw new Error(`Chunk not found: ${event.chunkKey}`);
      }
      event.operation(chunk);
      return context;
    },

    updateCurrentAction: (context, event: { action: Action }) => {
      if (isInitialStore(context)) return;

      const chunkKeys = getChunkKeysFromAction(event.action);

      // Update each affected chunk's active action
      for (const chunkKey of chunkKeys) {
        const chunk = context.canvas.chunkCanvases[chunkKey];
        if (chunk) {
          chunk.updateRelatedActiveAction(event.action);
        }
      }

      return {
        ...context,
        activeAction: event.action,
      };
    },

    updateActionById: (context, event: { action: EditableAction }) => {
      if (isInitialStore(context)) return;

      const chunkKeys = getChunkKeysFromAction(event.action);

      for (const chunkKey of chunkKeys) {
        const chunk = context.canvas.chunkCanvases[chunkKey];
        if (chunk) {
          chunk.updateActionById(event.action);
        }
      }

      return {
        ...context,
        actions: context.actions.map((action) => {
          if (!isEditableAction(action)) return action;

          if (action.action_id === event.action.action_id) return event.action;
          return action;
        }),
      };
    },

    redrawSpecificPixels: (context, event: { pixels: Pixel[] }) => {
      if (isInitialStore(context)) return;

      const chunkKeys = getUniqueChunksFromPixels(event.pixels);

      for (const chunkKey of chunkKeys) {
        const chunk = context.canvas.chunkCanvases[chunkKey];
        if (chunk) {
          chunk.unsetSpecificPixels(
            event.pixels.filter((pixel) => getChunkKey(pixel.x, pixel.y) === chunkKey),
          );
        }
      }
      return context;
    },

    completeCurrentAction: (context, event: { action: Action }) => {
      if (isInitialStore(context)) return;

      const chunkKeys = getChunkKeysFromAction(event.action);

      // Add action to each affected chunk and clear its active action
      for (const chunkKey of chunkKeys) {
        const chunk = context.canvas.chunkCanvases[chunkKey];
        if (chunk) {
          chunk.completeActiveAction(event.action);
        }
      }

      return {
        ...context,
        activeAction: null,
        actions: context.actions.concat(event.action),
      };
    },

    addAction: (context, event: { action: Action }) => {
      if (isInitialStore(context)) return;

      const chunkKeys = getChunkKeysFromAction(event.action);

      // Add action to each affected chunk
      for (const chunkKey of chunkKeys) {
        const chunk = context.canvas.chunkCanvases[chunkKey];
        if (chunk) {
          chunk.addRelatedAction(event.action);
        }
      }

      return {
        ...context,
        actions: context.actions.concat(event.action),
      };
    },

    //////////////// Realtime events /////////////////

    newRealtimePixels: (context, event: { pixels: Pixel[] }, enqueue) => {
      if (isInitialStore(context)) return;

      enqueue.effect(() => {
        store.trigger.addAction({
          action: {
            type: "realtime-active",
            pixels: event.pixels,
            chunkKeys: getUniqueChunksFromPixels(event.pixels),
          },
        });
      });

      return context;
    },

    newPixels: (context, event: { pixels: Pixel[]; action_id: string }) => {
      if (isInitialStore(context)) return;

      newPixels(context, event.pixels, event.action_id);

      return context;
    },

    filterPixelsFromActions: (
      context,
      event: { action_id: string; rejected_pixels: Pixel[] },
      enqueue,
    ) => {
      if (isInitialStore(context)) return;

      const next_actions = updateActionBasedOnRejectedPixels(
        context.actions,
        event.rejected_pixels,
        event.action_id,
      );

      enqueue.effect(() => {
        const action = next_actions.find(
          (action): action is EditableAction =>
            isEditableAction(action) && action.action_id === event.action_id,
        );
        if (action) {
          store.trigger.updateActionById({ action });
          store.trigger.redrawSpecificPixels({
            pixels: event.rejected_pixels,
          });
        }
      });

      return {
        ...context,
        actions: next_actions,
      };
    },

    //////////////// Unknown events /////////////////

    fetchPixels: (context, _, enqueue) => {
      if (isInitialStore(context)) return;

      const { x, y, zoom } = context.camera;
      const pixelWidth = zoom / 20;
      const otherX = x + Math.floor(window.innerWidth / pixelWidth);
      const otherY = y + Math.floor(window.innerHeight / pixelWidth);

      const originChunkX = Math.floor(x / CHUNK_LENGTH);
      const originChunkY = Math.floor(y / CHUNK_LENGTH);

      const otherChunkX = Math.floor(otherX / CHUNK_LENGTH);
      const otherChunkY = Math.floor(otherY / CHUNK_LENGTH);

      for (let i = originChunkX; i <= otherChunkX; i += 1) {
        for (let j = originChunkY; j <= otherChunkY; j += 1) {
          const chunkX = i * CHUNK_LENGTH;
          const chunkY = j * CHUNK_LENGTH;
          if (context.canvas.chunkCanvases[`x: ${chunkX} y: ${chunkY}`] != null) {
            console.log(`skipping fetch for cached chunk x: ${chunkX} y: ${chunkY}`);
            continue;
          }
          const chunkKey = getChunkKey(chunkX, chunkY);

          context.canvas.chunkCanvases[chunkKey] = new Chunk(chunkX, chunkY, context.canvas.device);

          enqueue.effect(async () => {
            context.queryClient
              .fetchQuery({
                queryKey: ["pixels", chunkKey],
                queryFn: () => fetchPixels(context.server.apiOrigin, chunkX, chunkY),
              })
              .then((pixels) => {
                store.trigger.chunkOp({
                  chunkKey,
                  operation: (chunk) => {
                    chunk.initializeWithPixels(pixels);
                  },
                });
              });

            context.queryClient
              .fetchQuery({
                queryKey: ["plots", chunkKey],
                queryFn: () => getPlotsByChunk(chunkX, chunkY),
              })
              .then((plots) =>
                store.trigger.chunkOp({
                  chunkKey,
                  operation: (chunk) => {
                    chunk.upsertPlots(
                      plots.map((plot) => ({
                        ...plot,
                        polygon: polygonSchema.parse({
                          vertices: plot.polygon.vertices.map((vertex) => {
                            return [vertex[0] - chunkX, vertex[1] - chunkY];
                          }),
                        }),
                      })),
                    );
                  },
                }),
              );
          });
        }
      }
      return context;
    },

    //////////////// Tool events /////////////////

    moveCamera: (
      context,
      event: {
        camera: Partial<Camera>;
        options?: { deselectPlot: boolean; autoSelectPlot?: boolean };
      },
      enqueue,
    ) => {
      if (isInitialStore(context)) return;

      const options = {
        deselectPlot: true,
        autoSelectPlot: true,
        ...event.options,
      };

      const newCamera = { ...context.camera, ...event.camera };

      enqueue.effect(async () => {
        store.trigger.resizeRealtimeAndTelegraphCanvases();

        // Show crosshair at center when camera moves
        showCrosshair();
        store.trigger.fetchPixels();

        if (options.autoSelectPlot) {
          // Get the center point of the new camera position
          const centerPoint = getCameraCenterPoint(newCamera);

          let plotAtCenter = findPlotAtPoint(centerPoint, {
            ...context,
            camera: newCamera,
          });

          if (plotAtCenter) {
            // Select the plot found at center
            store.trigger.selectPlot({ plotId: plotAtCenter.id });
          } else if (options.deselectPlot) {
            // Only deselect if no plot found and deselectPlot is true
            store.trigger.deselectPlot();
          }
        } else if (options.deselectPlot) {
          store.trigger.deselectPlot();
        }
      });

      return {
        ...context,
        camera: newCamera,
      };
    },

    changeTool: (context, event: { tool: Tool }) => {
      if (isInitialStore(context)) return;

      const toolSettings: ToolSettings = {
        ...context.toolSettings,
        currentTool: event.tool,
      };

      updateToolSettings(toolSettings);

      // Reset cursor when changing tools
      if (!isInitialStore(context)) {
        context.canvas.rootCanvas.style.cursor = "";
      }

      return {
        ...context,
        toolSettings,
      };
    },

    updatePaletteSettings: (context, { palette }: { palette: Partial<PaletteSettings> }) => {
      if (isInitialStore(context)) return;

      const toolSettings = {
        ...context.toolSettings,
        palette: { ...context.toolSettings.palette, ...palette },
      };

      updateToolSettings(toolSettings);

      return {
        ...context,
        toolSettings,
      };
    },

    updateBrushSettings: (context, { brush }: { brush: Partial<BrushSettings> }) => {
      if (isInitialStore(context)) return;

      const toolSettings = {
        ...context.toolSettings,
        brush: { ...context.toolSettings.brush, ...brush },
      };

      updateToolSettings(toolSettings);

      return {
        ...context,
        toolSettings,
      };
    },

    updateErasureSettings: (context, { erasure }: { erasure: Partial<ErasureSettings> }) => {
      if (isInitialStore(context)) return;
      const toolSettings = {
        ...context.toolSettings,
        erasure: { ...context.toolSettings.erasure, ...erasure },
      };

      updateToolSettings(toolSettings);

      return {
        ...context,
        toolSettings,
      };
    },

    updateLineSettings: (context, { line }: { line: Partial<LineSettings> }) => {
      if (isInitialStore(context)) return;
      const toolSettings = {
        ...context.toolSettings,
        line: { ...context.toolSettings.line, ...line },
      };

      updateToolSettings(toolSettings);

      return {
        ...context,
        toolSettings,
      };
    },

    updateShapePickerSettings: (
      context,
      { shapePicker }: { shapePicker: Partial<ShapePickerSettings> },
    ) => {
      if (isInitialStore(context)) return;
      const toolSettings = {
        ...context.toolSettings,
        shapePicker: { ...context.toolSettings.shapePicker, ...shapePicker },
      };

      updateToolSettings(toolSettings);

      return {
        ...context,
        toolSettings,
      };
    },

    togglePlotBorderVisibility: (context) => {
      if (isInitialStore(context)) return;
      if (!isAdminUser(context.user)) return context;

      return {
        ...context,
        adminSettings: {
          ...context.adminSettings,
          plotBordersVisible: !context.adminSettings.plotBordersVisible,
        },
      };
    },

    toggleChunkBorderVisibility: (context) => {
      if (isInitialStore(context)) return;
      if (!isAdminUser(context.user)) return context;

      return {
        ...context,
        adminSettings: {
          ...context.adminSettings,
          chunkBordersVisible: !context.adminSettings.chunkBordersVisible,
        },
      };
    },

    toggleAdminCanvasEditing: (context) => {
      if (isInitialStore(context)) return;
      if (!isAdminUser(context.user)) return context;

      return {
        ...context,
        adminSettings: {
          ...context.adminSettings,
          isAdminCanvasEditingEnabled: !context.adminSettings.isAdminCanvasEditingEnabled,
        },
      };
    },

    toggleAdminPlotEditing: (context) => {
      if (isInitialStore(context)) return;
      if (!isAdminUser(context.user)) return context;

      return {
        ...context,
        adminSettings: {
          ...context.adminSettings,
          isAdminPlotEditingEnabled: !context.adminSettings.isAdminPlotEditingEnabled,
        },
      };
    },

    toggleAdminZoom: (context) => {
      if (isInitialStore(context)) return;
      if (!isAdminUser(context.user)) return context;

      return {
        ...context,
        adminSettings: {
          ...context.adminSettings,
          isAdminZoomEnabled: !context.adminSettings.isAdminZoomEnabled,
        },
      };
    },

    //////////////// Claim events//////////////////

    clearClaim: (context) => {
      if (isInitialStore(context)) return;
      return {
        ...context,
        activeAction: null,
      };
    },

    cancelClaimerEdit: (context) => {
      if (isInitialStore(context)) return;

      // Cancel any active edit or resize actions
      const shouldClearAction =
        context.activeAction?.type === ACTION_TYPES.CLAIMER_EDIT ||
        context.activeAction?.type === ACTION_TYPES.CLAIMER_RESIZE_EDIT;

      if (!shouldClearAction) {
        return context;
      }

      return {
        ...context,
        activeAction: null,
      };
    },

    completeClaim: (context) => {
      if (isInitialStore(context)) return;

      if (context.activeAction?.type !== ACTION_TYPES.CLAIMER_CREATE) {
        throw new Error("Attempted to complete a claim when there isn't on active");
      }

      const polygon = context.activeAction.polygon;

      if (polygon == null) {
        throw new Error("No polygon to complete claim");
      }

      context.queryClient.refetchQueries({ queryKey: ["user", "plots"] });

      return {
        ...context,
        actions: context.actions.concat(completeRectangleClaimerAction([polygon])),
        activeAction: null,
      };
    },

    /////////////// Plot events /////////////////
    moveToPlot: (context, { plotId }: { plotId: number }, enqueue) => {
      if (isInitialStore(context)) return;

      let polygon = findPlotById(plotId, context)?.polygon;
      enqueue.effect(async () => {
        if (polygon == null) {
          console.trace("Plot with id of ${plotId} not found locally. Fetching it");
          const plot = await getPlot(plotId, {
            include_deleted: true,
          });

          if (plot.deletedAt != null) {
            toasts.cantMoveToDeletedPlot(plot.deletedAt);
            return;
          }

          polygon = plot.polygon;
        }

        if (polygon != null) {
          store.trigger.moveCamera({
            camera: centerCameraOnPoint(
              getCenterPoint(polygon),
              store.getSnapshot().context.camera,
            ),
            options: { deselectPlot: false, autoSelectPlot: false },
          });
        } else {
          console.log("No polygon found for plot, so not moving camera", plotId);
        }
      });
    },

    selectPlot: (context, { plotId }: { plotId: number }) => {
      if (isInitialStore(context)) return;

      return {
        ...context,
        toolSettings: {
          ...context.toolSettings,
          claimer: { selectedPlotId: plotId },
        },
      };
    },

    startEditPlot: (context, { plotId }: { plotId: number }, enqueue) => {
      if (isInitialStore(context)) return;

      const plot = findPlotById(plotId, context);
      if (!plot?.polygon) {
        console.error("Cannot edit plot: plot not found or has no polygon");
        return context;
      }

      enqueue.effect(() => {
        store.trigger.changeTool({ tool: Tool.Claimer });
      });

      return {
        ...context,
        activeAction: startEditAction(plotId, plot.polygon),
      };
    },

    deselectPlot: (context, _, enqueue) => {
      if (isInitialStore(context)) return;

      enqueue.effect(() => {
        store.trigger.cancelClaimerEdit();
      });

      return {
        ...context,
        toolSettings: {
          ...context.toolSettings,
          claimer: { selectedPlotId: undefined },
        },
      };
    },

    //////////// Interaction state events ////////////

    clearCursor: (context) => {
      if (isInitialStore(context)) return;
      return {
        ...context,
        interaction: { ...context.interaction, cursorPosition: null },
      };
    },

    setCursorPosition: (
      context,
      { cursorPosition }: { cursorPosition: { clientX: number; clientY: number } },
    ) => {
      if (isInitialStore(context)) return;
      return {
        ...context,
        interaction: {
          ...context.interaction,
          cursorPosition: cursorPosition,
        },
      };
    },

    setIsPressed: (context, { isPressed }: { isPressed: boolean }) => {
      if (isInitialStore(context)) return;
      return {
        ...context,
        interaction: { ...context.interaction, isPressed },
      };
    },

    setIsSpacePressed: (context, { isSpacePressed }: { isSpacePressed: boolean }) => {
      if (isInitialStore(context)) return;
      return {
        ...context,
        interaction: { ...context.interaction, isSpacePressed },
      };
    },

    ///////////// Event handlers ////////////////

    onPointerDown: (context, { e }: { e: PointerEvent }, enqueue) => {
      if (isInitialStore(context)) return;

      enqueue.effect(() => store.trigger.setIsPressed({ isPressed: true }));

      if (context.interaction.isSpacePressed) {
        return MoveTool.onPointerDown(e, context);
      }

      const isShapeActionActive =
        context.activeAction?.type === ACTION_TYPES.RECTANGLE_ACTIVE ||
        context.activeAction?.type === ACTION_TYPES.RECTANGLE_FILL_ACTIVE ||
        context.activeAction?.type === ACTION_TYPES.ELLIPSE_ACTIVE ||
        context.activeAction?.type === ACTION_TYPES.ELLIPSE_FILL_ACTIVE;

      // Alt/Option key quick mode: temporarily switch to eyedropper
      // Skip this if we're actively using a shape tool (Shift/Alt are used for constraints/center drawing)
      if ((context.interaction.isAltPressed || e.altKey) && !isShapeActionActive) {
        return EyedropperTool.onPointerDown(e, context, enqueue);
      }

      const tool = context.toolSettings.currentTool;

      if (tool === Tool.Move) {
        return MoveTool.onPointerDown(e, context);
      }

      if (tool === Tool.Brush) {
        return BrushTool.onPointerDown(e, context, enqueue);
      }

      if (tool === Tool.Erasure) {
        return ErasureTool.onPointerDown(e, context, enqueue);
      }

      if (tool === Tool.Line) {
        return LineTool.onPointerDown(e, context, enqueue);
      }

      if (tool === Tool.Claimer) {
        return ClaimerTool.onPointerDown(e, context, enqueue);
      }

      if (tool === Tool.Bucket) {
        return BucketTool.onPointerDown(e, context, enqueue);
      }

      if (tool === Tool.Eyedropper) {
        return EyedropperTool.onPointerDown(e, context, enqueue);
      }

      if (tool === Tool.Rectangle) {
        return RectangleTool.onPointerDown(e, context, enqueue);
      }

      if (tool === Tool.RectangleFill) {
        return RectangleFillTool.onPointerDown(e, context, enqueue);
      }

      if (tool === Tool.Ellipse) {
        return EllipseTool.onPointerDown(e, context, enqueue);
      }

      if (tool === Tool.EllipseFill) {
        return EllipseFillTool.onPointerDown(e, context, enqueue);
      }

      return context;
    },

    onPointerMove: (context, { e }: { e: PointerEvent }, enqueue) => {
      if (isInitialStore(context)) return;

      enqueue.effect(() => {
        store.trigger.setCursorPosition({ cursorPosition: e });
      });

      // Alt/Option key quick mode: show eyedropper cursor
      // Skip this if we're actively using a shape tool
      const isShapeActionActive =
        context.activeAction?.type === ACTION_TYPES.RECTANGLE_ACTIVE ||
        context.activeAction?.type === ACTION_TYPES.RECTANGLE_FILL_ACTIVE ||
        context.activeAction?.type === ACTION_TYPES.ELLIPSE_ACTIVE ||
        context.activeAction?.type === ACTION_TYPES.ELLIPSE_FILL_ACTIVE;

      if ((context.interaction.isAltPressed || e.altKey) && !isShapeActionActive) {
        return EyedropperTool.onPointerMove(e, context, enqueue);
      }

      const tool = context.toolSettings.currentTool;

      if (tool === Tool.Brush) {
        return BrushTool.onPointerMove(e, context, enqueue);
      }

      if (tool === Tool.Erasure) {
        return ErasureTool.onPointerMove(e, context, enqueue);
      }

      if (tool === Tool.Line) {
        return LineTool.onPointerMove(e, context, enqueue);
      }

      if (tool === Tool.Claimer) {
        return ClaimerTool.onPointerMove(e, context, enqueue);
      }

      if (tool === Tool.Bucket) {
        return BucketTool.onPointerMove(e, context, enqueue);
      }

      if (tool === Tool.Eyedropper) {
        return EyedropperTool.onPointerMove(e, context, enqueue);
      }

      if (tool === Tool.Rectangle) {
        return RectangleTool.onPointerMove(e, context, enqueue);
      }

      if (tool === Tool.RectangleFill) {
        return RectangleFillTool.onPointerMove(e, context, enqueue);
      }

      if (tool === Tool.Ellipse) {
        return EllipseTool.onPointerMove(e, context, enqueue);
      }

      if (tool === Tool.EllipseFill) {
        return EllipseFillTool.onPointerMove(e, context, enqueue);
      }

      return context;
    },

    onPointerUp: (context, { e }: { e: PointerEvent }, enqueue) => {
      if (isInitialStore(context)) return;

      enqueue.effect(() => {
        return store.trigger.setIsPressed({ isPressed: false });
      });
      const tool = context.toolSettings.currentTool;

      if (tool === Tool.Brush) {
        return BrushTool.onPointerUp(e, context, enqueue);
      }

      if (tool === Tool.Erasure) {
        return ErasureTool.onPointerUp(e, context, enqueue);
      }

      if (tool === Tool.Line) {
        return LineTool.onPointerUp(e, context, enqueue);
      }

      if (tool === Tool.Claimer) {
        return ClaimerTool.onPointerUp(e, context, enqueue);
      }

      if (tool === Tool.Rectangle) {
        return RectangleTool.onPointerUp(e, context, enqueue);
      }

      if (tool === Tool.RectangleFill) {
        return RectangleFillTool.onPointerUp(e, context, enqueue);
      }

      if (tool === Tool.Ellipse) {
        return EllipseTool.onPointerUp(e, context, enqueue);
      }

      if (tool === Tool.EllipseFill) {
        return EllipseFillTool.onPointerUp(e, context, enqueue);
      }

      return context;
    },

    onPointerOut: (context, { e }: { e: PointerEvent }, enqueue) => {
      if (isInitialStore(context)) return;

      enqueue.effect(() => store.trigger.setIsPressed({ isPressed: false }));
      enqueue.effect(() => store.trigger.clearCursor());
      const tool = context.toolSettings.currentTool;

      if (tool === Tool.Brush) {
        return BrushTool.onPointerOut(e, context, enqueue);
      }

      if (tool === Tool.Erasure) {
        return ErasureTool.onPointerOut(e, context, enqueue);
      }

      if (tool === Tool.Line) {
        return LineTool.onPointerOut(e, context, enqueue);
      }

      if (tool === Tool.Claimer) {
        return ClaimerTool.onPointerOut(e, context, enqueue);
      }

      if (tool === Tool.Rectangle) {
        return RectangleTool.onPointerOut(e, context, enqueue);
      }

      if (tool === Tool.RectangleFill) {
        return RectangleFillTool.onPointerOut(e, context, enqueue);
      }

      if (tool === Tool.Ellipse) {
        return EllipseTool.onPointerOut(e, context, enqueue);
      }

      if (tool === Tool.EllipseFill) {
        return EllipseFillTool.onPointerOut(e, context, enqueue);
      }

      return context;
    },

    onKeyDown: (context, { e }: { e: KeyboardEvent }, enqueue) => {
      if (isInitialStore(context)) return;
      if (e.defaultPrevented) return;

      if (isAdminUser(context.user) && isHotkey("mod+shift+b", e)) {
        e.preventDefault();
        enqueue.effect(() => store.trigger.togglePlotBorderVisibility());
        return context;
      }

      if (isAdminUser(context.user) && isHotkey("mod+shift+c", e)) {
        e.preventDefault();
        enqueue.effect(() => store.trigger.toggleChunkBorderVisibility());
        return context;
      }

      // Undo/Redo shortcuts
      if (isHotkey("mod+shift+z", e)) {
        e.preventDefault();
        enqueue.effect(() => store.trigger.redo());
        return context;
      }

      if (isHotkey("mod+z", e)) {
        e.preventDefault();
        enqueue.effect(() => store.trigger.undo());
        return context;
      }

      // Camera zoom shortcuts (Cmd/Ctrl + Plus/Minus)
      // Platform-specific: Mac uses metaKey (Cmd), Windows uses ctrlKey
      const isMac =
        /Mac|iPhone|iPod|iPad/i.test(navigator.platform) ||
        /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent);
      const isModKeyPressed = isMac ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
      // Use e.code for more reliable key detection (Equal for =/+ key, Minus for -/_ key)
      const isZoomIn = isModKeyPressed && (e.code === "Equal" || e.key === "=" || e.key === "+");
      const isZoomOut = isModKeyPressed && (e.code === "Minus" || e.key === "-" || e.key === "_");

      if (isZoomIn || isZoomOut) {
        e.preventDefault();

        const pixelWidth = context.camera.zoom / 20;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Non-linear zoom stops (extended for admins when enabled)
        const isAdminZoomEnabled =
          isAdminUser(context.user) && context.adminSettings.isAdminZoomEnabled;
        const zoomMin = isAdminZoomEnabled ? ZOOM_MIN_ADMIN : ZOOM_MIN;
        const zoomStops = isAdminZoomEnabled
          ? [10, 15, 20, 30, 40, 50, 60, 75, 100, 150, 200, 300, 400, 600, 800]
          : [50, 60, 75, 100, 150, 200, 300, 400, 600, 800];
        const currentZoom = context.camera.zoom;

        let nextZoom: number;
        if (isZoomIn) {
          // Find the next zoom stop greater than current zoom
          const nextStop = zoomStops.find((stop) => stop > currentZoom);
          nextZoom = nextStop
            ? clamp(nextStop, zoomMin, ZOOM_MAX)
            : clamp(currentZoom, zoomMin, ZOOM_MAX);
        } else {
          // Find the previous zoom stop less than current zoom
          const previousStop = zoomStops
            .slice()
            .reverse()
            .find((stop) => stop < currentZoom);
          nextZoom = previousStop
            ? clamp(previousStop, zoomMin, ZOOM_MAX)
            : clamp(currentZoom, zoomMin, ZOOM_MAX);
        }

        const pixelX = centerX / pixelWidth;
        const pixelY = centerY / pixelWidth;

        const nextPixelWidth = nextZoom / 20;
        const nextPixelX = centerX / nextPixelWidth;
        const nextPixelY = centerY / nextPixelWidth;

        const deltaXFromZoom = pixelX - nextPixelX;
        const deltaYFromZoom = pixelY - nextPixelY;

        enqueue.effect(() => {
          store.trigger.moveCamera({
            camera: {
              zoom: roundTo1Place(nextZoom),
              x: roundTo1Place(clamp(context.camera.x + deltaXFromZoom, X_MIN, X_MAX)),
              y: roundTo1Place(clamp(context.camera.y + deltaYFromZoom, Y_MIN, Y_MAX)),
            },
          });
        });

        return context;
      }

      // Arrow key navigation in move mode (move by 1 pixel)
      const isMoveMode =
        context.interaction.isSpacePressed || context.toolSettings.currentTool === Tool.Move;

      if (isMoveMode) {
        const arrowKeys: Record<string, { dx: number; dy: number }> = {
          ArrowUp: { dx: 0, dy: -1 },
          ArrowDown: { dx: 0, dy: 1 },
          ArrowLeft: { dx: -1, dy: 0 },
          ArrowRight: { dx: 1, dy: 0 },
        };

        const direction = arrowKeys[e.code];
        if (direction) {
          e.preventDefault();
          enqueue.effect(() => {
            store.trigger.moveCamera({
              camera: {
                x: clamp(context.camera.x + direction.dx, X_MIN, X_MAX),
                y: clamp(context.camera.y + direction.dy, Y_MIN, Y_MAX),
              },
            });
          });
          return context;
        }
      }

      // Don't trigger shortcuts when typing in input elements
      const target = e.target as HTMLElement;
      const isInputElement = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      const isContentEditable = target.contentEditable === "true";
      if (isInputElement || isContentEditable) return context;

      // Tool shortcuts (Aseprite-style)
      if (isHotkey("b", e)) {
        e.preventDefault();
        enqueue.effect(() => store.trigger.changeTool({ tool: Tool.Brush }));
        return context;
      }

      if (isHotkey("e", e)) {
        e.preventDefault();
        enqueue.effect(() => store.trigger.changeTool({ tool: Tool.Erasure }));
        return context;
      }

      if (isHotkey("c", e)) {
        e.preventDefault();
        enqueue.effect(() => store.trigger.changeTool({ tool: Tool.Claimer }));
        return context;
      }

      if (isHotkey("l", e)) {
        e.preventDefault();
        enqueue.effect(() => store.trigger.changeTool({ tool: Tool.Line }));
        return context;
      }

      if (isHotkey("g", e)) {
        e.preventDefault();
        enqueue.effect(() => store.trigger.changeTool({ tool: Tool.Bucket }));
        return context;
      }

      // Palette navigation shortcuts (now for foreground color)
      if (isHotkey("[", e)) {
        e.preventDefault();
        enqueue.effect(() =>
          store.trigger.updatePaletteSettings({
            palette: {
              foregroundColorRef: getPreviousColor(context.toolSettings.palette.foregroundColorRef),
            },
          }),
        );
        return context;
      }

      if (isHotkey("]", e)) {
        e.preventDefault();
        enqueue.effect(() =>
          store.trigger.updatePaletteSettings({
            palette: {
              foregroundColorRef: getNextColor(context.toolSettings.palette.foregroundColorRef),
            },
          }),
        );
        return context;
      }

      // Swap foreground and background colors
      if (isHotkey("x", e)) {
        e.preventDefault();
        const foregroundColorRef = context.toolSettings.palette.foregroundColorRef;
        const backgroundColorRef = context.toolSettings.palette.backgroundColorRef;
        enqueue.effect(() =>
          store.trigger.updatePaletteSettings({
            palette: {
              foregroundColorRef: backgroundColorRef,
              backgroundColorRef: foregroundColorRef,
            },
          }),
        );
        return context;
      }

      // Cycle through foreground colors with 9 and 0 keys
      if (isHotkey("9", e)) {
        e.preventDefault();
        enqueue.effect(() =>
          store.trigger.updatePaletteSettings({
            palette: {
              foregroundColorRef: getPreviousColor(context.toolSettings.palette.foregroundColorRef),
            },
          }),
        );
        return context;
      }

      if (isHotkey("0", e)) {
        e.preventDefault();
        enqueue.effect(() =>
          store.trigger.updatePaletteSettings({
            palette: {
              foregroundColorRef: getNextColor(context.toolSettings.palette.foregroundColorRef),
            },
          }),
        );
        return context;
      }

      // Tool size shortcuts (plus/minus)
      if (isHotkey("+", e) || isHotkey("=", e)) {
        e.preventDefault();

        if (context.toolSettings.currentTool === Tool.Brush) {
          const currentSize = context.toolSettings.brush.size;
          enqueue.effect(() =>
            store.trigger.updateBrushSettings({
              brush: { size: clampBrushSize(currentSize + 1) },
            }),
          );
        }

        if (context.toolSettings.currentTool === Tool.Erasure) {
          const currentSize = context.toolSettings.erasure.size;
          enqueue.effect(() =>
            store.trigger.updateErasureSettings({
              erasure: {
                size: clampErasureSize(currentSize + 1),
              },
            }),
          );
        }

        if (context.toolSettings.currentTool === Tool.Line) {
          const currentSize = context.toolSettings.line.size;
          enqueue.effect(() =>
            store.trigger.updateLineSettings({
              line: { size: clampLineSize(currentSize + 1) },
            }),
          );
        }

        if (
          context.toolSettings.currentTool === Tool.Rectangle ||
          context.toolSettings.currentTool === Tool.Ellipse
        ) {
          const currentSize = context.toolSettings.line.size;
          enqueue.effect(() =>
            store.trigger.updateLineSettings({
              line: { size: clampLineSize(currentSize + 1) },
            }),
          );
        }

        return context;
      }

      if (isHotkey("-", e) || isHotkey("_", e)) {
        e.preventDefault();
        if (context.toolSettings.currentTool === Tool.Brush) {
          const currentSize = context.toolSettings.brush.size;
          enqueue.effect(() =>
            store.trigger.updateBrushSettings({
              brush: { size: clampBrushSize(currentSize - 1) },
            }),
          );
        }

        if (context.toolSettings.currentTool === Tool.Erasure) {
          const currentSize = context.toolSettings.erasure.size;
          enqueue.effect(() =>
            store.trigger.updateErasureSettings({
              erasure: {
                size: clampErasureSize(currentSize - 1),
              },
            }),
          );
        }

        if (context.toolSettings.currentTool === Tool.Line) {
          const currentSize = context.toolSettings.line.size;
          enqueue.effect(() =>
            store.trigger.updateLineSettings({
              line: { size: clampLineSize(currentSize - 1) },
            }),
          );
        }

        if (
          context.toolSettings.currentTool === Tool.Rectangle ||
          context.toolSettings.currentTool === Tool.Ellipse
        ) {
          const currentSize = context.toolSettings.line.size;
          enqueue.effect(() =>
            store.trigger.updateLineSettings({
              line: { size: clampLineSize(currentSize - 1) },
            }),
          );
        }

        return context;
      }

      // Space key: toggle move mode
      if (e.code === KeyboardCode.Space) {
        if (!context.interaction.isSpacePressed) {
          return {
            ...context,
            interaction: {
              ...context.interaction,
              isSpacePressed: true,
              previousTool: context.interaction.previousTool ?? context.toolSettings.currentTool,
            },
            toolSettings: {
              ...context.toolSettings,
              currentTool: Tool.Move,
            },
          };
        }
      }

      // Alt/Option key: toggle eyedropper mode
      // Only trigger when Alt is pressed by itself (not as a modifier for another key)
      if (e.code === "AltLeft" || e.code === "AltRight") {
        const isShapeActionActive =
          context.activeAction?.type === ACTION_TYPES.RECTANGLE_ACTIVE ||
          context.activeAction?.type === ACTION_TYPES.RECTANGLE_FILL_ACTIVE ||
          context.activeAction?.type === ACTION_TYPES.ELLIPSE_ACTIVE ||
          context.activeAction?.type === ACTION_TYPES.ELLIPSE_FILL_ACTIVE;

        if (isShapeActionActive) {
          return context;
        }

        // Only toggle if not already in eyedropper mode
        if (!context.interaction.isAltPressed) {
          return {
            ...context,
            interaction: {
              ...context.interaction,
              isAltPressed: true,
              previousTool: context.toolSettings.currentTool,
            },
            toolSettings: {
              ...context.toolSettings,
              currentTool: Tool.Eyedropper,
            },
          };
        }
      }
      return context;
    },

    onKeyUp: (context, { e }: { e: KeyboardEvent }) => {
      if (isInitialStore(context)) return;
      if (e.defaultPrevented) return;

      // Space key: restore previous tool
      if (e.code === KeyboardCode.Space) {
        if (context.interaction.isSpacePressed && context.interaction.previousTool !== null) {
          return {
            ...context,
            interaction: {
              ...context.interaction,
              isSpacePressed: false,
              previousTool: null,
            },
            toolSettings: {
              ...context.toolSettings,
              currentTool: context.interaction.previousTool,
            },
          };
        }
      }

      // Alt/Option key: restore previous tool and cursor
      if (e.code === "AltLeft" || e.code === "AltRight") {
        if (context.interaction.isAltPressed && context.interaction.previousTool !== null) {
          const restoredContext = {
            ...context,
            interaction: {
              ...context.interaction,
              isAltPressed: false,
              previousTool: null,
            },
            toolSettings: {
              ...context.toolSettings,
              currentTool: context.interaction.previousTool,
            },
          };

          return restoredContext;
        }
      }
      return context;
    },

    onWheel: (context, { e }: { e: WheelEvent }, enqueue) => {
      if (isInitialStore(context)) return;

      // Palette navigation with Alt/Option + scroll
      if (e.altKey) {
        e.preventDefault();

        const currentColorRef = e.shiftKey
          ? context.toolSettings.palette.backgroundColorRef
          : context.toolSettings.palette.foregroundColorRef;

        const nextColorRef =
          e.deltaY < 0 ? getPreviousColor(currentColorRef) : getNextColor(currentColorRef);

        enqueue.effect(() => {
          if (e.shiftKey) {
            store.trigger.updatePaletteSettings({
              palette: {
                backgroundColorRef: nextColorRef,
              },
            });
          } else {
            store.trigger.updatePaletteSettings({
              palette: {
                foregroundColorRef: nextColorRef,
              },
            });
          }
        });

        return context;
      }

      WheelTool.onWheel(context, e, enqueue);

      enqueue.effect(() => {
        store.trigger.resizeRealtimeAndTelegraphCanvases();
      });
      const tool = context.toolSettings.currentTool;

      if (tool === Tool.Brush) {
        return BrushTool.onWheel(e, context, enqueue);
      }

      if (tool === Tool.Erasure) {
        return ErasureTool.onWheel(e, context, enqueue);
      }

      if (tool === Tool.Line) {
        return LineTool.onWheel(e, context, enqueue);
      }

      if (tool === Tool.Claimer) {
        return ClaimerTool.onWheel(e, context, enqueue);
      }

      if (tool === Tool.Rectangle) {
        return RectangleTool.onWheel(e, context, enqueue);
      }

      if (tool === Tool.RectangleFill) {
        return RectangleFillTool.onWheel(e, context, enqueue);
      }

      if (tool === Tool.Ellipse) {
        return EllipseTool.onWheel(e, context, enqueue);
      }

      if (tool === Tool.EllipseFill) {
        return EllipseFillTool.onWheel(e, context, enqueue);
      }

      return context;
    },

    onResize: (context, _, enqueue) => {
      if (isInitialStore(context)) return;

      enqueue.effect(() => {
        resizeBackgroundCanvas(context.canvas.backgroundCanvas);
        drawBackgroundCanvas(
          context.canvas.backgroundCanvas,
          context.canvas.backgroundCanvasContext,
        );
        store.trigger.resizeRealtimeAndTelegraphCanvases();
      });

      return context;
    },
  },
});
