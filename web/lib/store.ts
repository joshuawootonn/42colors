import { createStore } from "@xstate/store";
import { Channel, Socket } from "phoenix";
import { BrushSettings, BrushTool, pointsToPixels } from "./tools/brush";
import { PanTool } from "./tools/pan";
import { QueryClient } from "@tanstack/react-query";
import { CHUNK_LENGTH } from "./constants";
import { fetchPixels7 } from "./fetch-pixels";
import {
  createBackgroundCanvas,
  drawBackgroundCanvas,
  resizeBackgroundCanvas,
} from "./canvas/background";
import {
  ChunkCanvases,
  clearChunkPixels,
  createChunkCanvas,
  drawToChunkCanvas,
  getChunkKey,
  unsetChunkPixels,
} from "./canvas/chunk";
import { getLastPixelValue, Pixel, pixelSchema } from "./geometry/coord";
import { draw } from "./canvas/draw";
import { setupChannel, setupSocketConnection } from "./geometry/sockets";
import { KeyboardCode } from "./keyboard-codes";
import { isInitialStore } from "./utils/is-initial-store";
import { WheelTool } from "./tools/wheel";
import {
  createRealtimeCanvas,
  redrawRealtimePixels,
  redrawUserPlots,
  resizeRealtimeCanvas,
} from "./canvas/realtime";
import {
  onWheel,
  onKeyDown,
  onKeyUp,
  onResize,
  onPointerMove,
  onPointerDown,
  onPointerUp,
  onPointerOut,
  onTouch,
  onGesture,
} from "./events";
import { TRANSPARENT_REF } from "./palette";
import { ErasureSettings, ErasureTool } from "./tools/erasure";
import { dedupeCoords } from "./utils/dedupe-coords";
import { uuid } from "./utils/uuid";
import {
  Action,
  derivePixelsFromActions,
  deriveUnsetPixelsFromActions,
  getActionToRedo,
  getActionToUndo,
  resolveActions,
} from "./actions";
import { newPixels } from "./channel";
import { Camera } from "./camera";
import { createFullsizeCanvas, resizeFullsizeCanvas } from "./canvas/fullsize";
import {
  DEFAULT_TOOL_SETTINGS,
  Tool,
  ToolSettings,
  updateToolSettings,
} from "./tool-settings";
import { PaletteSettings } from "./tools/palette";
import authService from "./auth";
import { ClaimerTool, completeRectangleClaimerAction } from "./tools/claimer";
import { getCompositePolygons, rectToPolygonSchema } from "./geometry/polygon";
import { getUserPlots } from "./tools/claimer.rest";

export type PointerState = "default" | "pressed";

export type InitialStore = {
  state: "initial";
  id: undefined;
  camera: Camera;
  server?: undefined;
  currentPointerState: PointerState;
  realtime?: undefined;
  interaction?: undefined;
  canvas?: undefined;
  user?: undefined;
  actions?: undefined;
  activeAction?: undefined;
  queryClient?: QueryClient;
  eventLoopRafId?: number;
  toolSettings: ToolSettings;
};

export type InitializedStore = {
  state: "initialized";
  camera: Camera;
  server: {
    apiOrigin: string;
    websocketOriginURL: string;
    authURL?: string;
    socket?: Socket;
    channel?: Channel;
  };
  toolSettings: ToolSettings;
  currentPointerState: PointerState;
  id: string;
  canvas: {
    bodyElement: HTMLBodyElement;
    rootCanvas: HTMLCanvasElement;
    rootCanvasContext: CanvasRenderingContext2D;
    backgroundCanvas: HTMLCanvasElement;
    backgroundCanvasContext: CanvasRenderingContext2D;
    realtimeCanvas: HTMLCanvasElement;
    realtimeCanvasContext: CanvasRenderingContext2D;
    telegraphCanvas: HTMLCanvasElement;
    telegraphCanvasContext: CanvasRenderingContext2D;
    nonPixelCanvas: HTMLCanvasElement;
    nonPixelCanvasContext: CanvasRenderingContext2D;
    chunkCanvases: ChunkCanvases;
  };
  actions: Action[];
  activeAction: Action | null;
  interaction: {
    isPressed: boolean;
    isSpacePressed: boolean;
    cursorPosition: { clientX: number; clientY: number } | null;
  };
  user?: {
    email: string;
    id: number;
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

const initialialStoreContext: Store = {
  id: undefined,
  state: "initial",
  camera: initialCamera,
  currentTool: "brush",
  currentColorRef: 1,
  currentPointerState: "default",
  toolSettings: DEFAULT_TOOL_SETTINGS,
} as Store;

export const store = createStore({
  context: initialialStoreContext,
  on: {
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
      },
      enqueue,
    ) => {
      const rootCanvasContext = event.canvas.getContext("2d")!;
      rootCanvasContext.imageSmoothingEnabled = false;

      const backgroundCanvas = createBackgroundCanvas();
      const backgroundCanvasContext = backgroundCanvas.getContext("2d")!;
      backgroundCanvasContext.imageSmoothingEnabled = false;
      drawBackgroundCanvas(backgroundCanvas, backgroundCanvasContext);

      const realtimeCanvas = createRealtimeCanvas(event.cameraOptions);
      const realtimeCanvasContext = realtimeCanvas.getContext("2d")!;
      realtimeCanvasContext.imageSmoothingEnabled = false;

      const telegraphCanvas = createFullsizeCanvas();
      const telegraphCanvasContext = telegraphCanvas.getContext("2d")!;
      telegraphCanvasContext.imageSmoothingEnabled = false;

      const nonPixelCanvas = createFullsizeCanvas();
      const nonPixelCanvasContext = telegraphCanvas.getContext("2d")!;
      nonPixelCanvasContext.imageSmoothingEnabled = false;

      enqueue.effect(() => {
        store.trigger.fetchPixels();
        store.trigger.fetchUser();
        store.trigger.subscribeToUserPlots();
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
        server: {
          apiOrigin: event.apiOrigin,
          websocketOriginURL: event.apiWebsocketOrigin,
        },
        toolSettings: event.toolSettings,
        interaction: {
          isPressed: false,
          isSpacePressed: false,
          cursorPosition: null,
        },
        actions: [],
        activeAction: null,
        canvas: {
          bodyElement: event.body,
          rootCanvas: event.canvas,
          rootCanvasContext,
          backgroundCanvas,
          backgroundCanvasContext,
          realtimeCanvas,
          realtimeCanvasContext,
          telegraphCanvas,
          telegraphCanvasContext,
          nonPixelCanvas,
          nonPixelCanvasContext,
          chunkCanvases: {},
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

      body.addEventListener("touchstart", onTouch, true);
      body.addEventListener("touchmove", onTouch, true);

      body.addEventListener("gesturestart", onGesture, true);
      body.addEventListener("gesturemove", onGesture, true);
      body.addEventListener("gestureend", onGesture, true);
    },

    unlisten: (
      _context,
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
    },

    newRealtimePixels: (context, event: { pixels: Pixel[] }, enqueue) => {
      if (isInitialStore(context)) return;

      clearChunkPixels(context.canvas.chunkCanvases, event.pixels);

      enqueue.effect(() => store.trigger.redrawRealtimeCanvas());

      return {
        ...context,
        actions: context.actions.concat({
          type: "realtime-active",
          pixels: event.pixels,
        }),
      };
    },

    newPixels: (context, event: { pixels: Pixel[] }) => {
      if (isInitialStore(context)) return;

      newPixels(context, event.pixels);

      return context;
    },

    undo: (context, _, enqueue) => {
      if (isInitialStore(context)) return;

      enqueue.effect(() => store.trigger.redrawRealtimeCanvas());

      const actionToUndo = getActionToUndo(context.actions);

      const nextActions = context.actions.concat({ type: "undo" });

      if (actionToUndo == null) {
        return {
          ...context,
          actions: nextActions,
        };
      }

      const pixels = pointsToPixels(
        actionToUndo.points,
        actionToUndo.type === "erasure-active"
          ? TRANSPARENT_REF
          : actionToUndo.colorRef,
      );

      const resolvedActions = resolveActions(nextActions);
      const resolvedPixels = derivePixelsFromActions(resolvedActions);
      const next: Pixel[] = [];
      for (let i = 0; i < pixels.length; i++) {
        const pixel = pixels[i];
        const lastPixelValue =
          getLastPixelValue(resolvedPixels, pixel) ??
          getLastPixelValue(
            context.canvas.chunkCanvases[getChunkKey(pixel.x, pixel.y)].pixels,
            pixel,
          ) ??
          pixelSchema.parse({
            x: pixel.x,
            y: pixel.y,
            colorRef: 0,
          });
        next.push(lastPixelValue);
      }

      newPixels(context, next);

      return {
        ...context,
        actions: nextActions,
      };
    },

    redo: (context, _, enqueue) => {
      if (isInitialStore(context)) return;

      enqueue.effect(() => store.trigger.redrawRealtimeCanvas());

      const nextActions = context.actions.concat({ type: "redo" });

      const actionToRedo = getActionToRedo(context.actions);

      if (actionToRedo == null) {
        return {
          ...context,
          actions: nextActions,
        };
      }

      const pixels = pointsToPixels(
        actionToRedo.points,
        actionToRedo.type === "erasure-active"
          ? TRANSPARENT_REF
          : actionToRedo.colorRef,
      );

      const resolvedActions = resolveActions(nextActions);
      const resolvedPixels = derivePixelsFromActions(resolvedActions);
      const next: Pixel[] = [];
      for (let i = 0; i < pixels.length; i++) {
        const pixel = pixels[i];
        const lastPixelValue =
          getLastPixelValue(resolvedPixels, pixel) ??
          getLastPixelValue(
            context.canvas.chunkCanvases[getChunkKey(pixel.x, pixel.y)].pixels,
            pixel,
          ) ??
          pixelSchema.parse({
            x: pixel.x,
            y: pixel.y,
            colorRef: 0,
          });
        next.push(lastPixelValue);
      }

      newPixels(context, next);

      return {
        ...context,
        actions: nextActions,
      };
    },

    setUser: (
      context,
      event: {
        user: { email: string; id: number; channel_token: string } | null;
      },
    ) => {
      if (isInitialStore(context)) return;
      return {
        ...context,
        user: event.user,
      };
    },

    reconnectToSocket: (
      context,
      event: {
        channel_token?: string;
      },
    ) => {
      if (isInitialStore(context)) return;
      const socket = setupSocketConnection(
        context.server.websocketOriginURL,
        event.channel_token,
      );
      const channel = setupChannel(socket);

      channel.on(
        "new_pixels",
        (payload: { pixels: Pixel[]; store_id: string }) => {
          if (payload.store_id === store.getSnapshot().context.id) {
            console.log(`skipping realtime since they came from this store`);
            return;
          }
          console.log("newRealtimePixels", payload.store_id, payload.pixels);
          store.trigger.newRealtimePixels({ pixels: payload.pixels });
        },
      );

      return {
        ...context,
        server: {
          ...context.server,
          socket,
          channel,
        },
      };
    },

    subscribeToUserPlots: (context, _, enqueue) => {
      if (isInitialStore(context)) return;
      const key = ["user", "plots"];

      enqueue.effect(() => {
        context.queryClient.getQueryCache().subscribe((event) => {
          if (event.query.queryKey === key) {
            store.trigger.redrawRealtimeCanvas();
          }
        });
      });
      context.queryClient.fetchQuery({
        queryKey: key,
        queryFn: getUserPlots,
      });
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
            store.trigger.setUser({ user: json ? json.user : null });
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
          if (
            context.canvas.chunkCanvases[`x: ${chunkX} y: ${chunkY}`] != null
          ) {
            console.log(
              `skipping fetch for cached chunk x: ${chunkX} y: ${chunkY}`,
            );
            continue;
          }
          const chunkKey = getChunkKey(chunkX, chunkY);

          const canvas = createChunkCanvas();
          const canvasContext = canvas.getContext("2d");
          canvasContext!.imageSmoothingEnabled = false;

          context.canvas.chunkCanvases[chunkKey] = {
            element: canvas,
            context: canvasContext!,
            x: chunkX,
            y: chunkY,
            pixels: [],
            renderConditions: { zoom: context.camera.zoom },
          };

          enqueue.effect(() =>
            context.queryClient
              .fetchQuery({
                queryKey: ["pixels", chunkKey],
                queryFn: () =>
                  fetchPixels7(context.server.apiOrigin, chunkX, chunkY),
              })
              .then((pixels) =>
                store.trigger.updateChunk({ chunkKey, pixels }),
              ),
          );
        }
      }
    },

    updateChunk: (
      context,
      { chunkKey, pixels }: { chunkKey: string; pixels: Pixel[] },
      enqueue,
    ) => {
      if (isInitialStore(context)) return;

      const prev = context.canvas.chunkCanvases[chunkKey];

      if (prev == null) {
        console.log(
          `skipping chunk update on uninitialized, chunkKey: ${chunkKey}`,
        );
        return;
      }

      context.canvas.chunkCanvases[chunkKey] = {
        ...prev,
        pixels: [...prev.pixels, ...pixels],
      };

      enqueue.effect(() =>
        store.trigger.drawToChunkCanvas({ chunkKey, pixels }),
      );
    },

    resizeRealtimeAndTelegraphCanvases: (context) => {
      if (isInitialStore(context)) return;
      resizeRealtimeCanvas(context.canvas.realtimeCanvas, context.camera);
      resizeFullsizeCanvas(context.canvas.telegraphCanvas);
    },

    redrawRealtimeCanvas: (context) => {
      if (isInitialStore(context)) return;

      const actions = context.activeAction
        ? context.actions.concat(context.activeAction)
        : context.actions;

      const pixels = derivePixelsFromActions(actions);

      const unsetPixels = deriveUnsetPixelsFromActions(actions);

      unsetChunkPixels(context.canvas.chunkCanvases, unsetPixels);

      const dedupedPixels = dedupeCoords(pixels);
      redrawRealtimePixels(
        context.canvas.realtimeCanvas,
        context.canvas.realtimeCanvasContext,
        dedupedPixels,
        context.camera,
      );
      redrawUserPlots(context);
      clearChunkPixels(context.canvas.chunkCanvases, dedupedPixels);
    },

    redrawTelegraph: (context) => {
      if (isInitialStore(context)) return;

      const tool = context.toolSettings.currentTool;
      switch (tool) {
        case "brush":
          BrushTool.redrawTelegraph(context);
          break;
        case "erasure":
          ErasureTool.redrawTelegraph(context);
          break;
        case "claimer":
          ClaimerTool.redrawTelegraph(context);
          break;
        default:
          console.log("default case of the redrawTelegraph");
      }
    },

    drawToChunkCanvas: (
      context,
      event: { chunkKey: string; pixels: Pixel[] },
    ) => {
      if (isInitialStore(context)) return;
      drawToChunkCanvas(
        context.canvas.chunkCanvases[event.chunkKey].element,
        context.canvas.chunkCanvases[event.chunkKey].context,
        event.pixels,
      );
    },

    moveCamera: (context, event: { camera: Partial<Camera> }, enqueue) => {
      if (isInitialStore(context)) return;

      enqueue.effect(() => {
        store.trigger.resizeRealtimeAndTelegraphCanvases();
        store.trigger.redrawRealtimeCanvas();
        store.trigger.redrawTelegraph();
      });

      return { ...context, camera: { ...context.camera, ...event.camera } };
    },

    draw: (context) => {
      if (isInitialStore(context)) return;
      draw(context);
    },

    changeTool: (context, event: { tool: Tool }) => {
      if (isInitialStore(context)) return;

      const toolSettings: ToolSettings = {
        ...context.toolSettings,
        currentTool: event.tool,
      };

      updateToolSettings(toolSettings);

      return {
        ...context,
        toolSettings,
      };
    },

    updatePaletteSettings: (
      context,
      { palette }: { palette: Partial<PaletteSettings> },
    ) => {
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

    updateBrushSettings: (
      context,
      { brush }: { brush: Partial<BrushSettings> },
    ) => {
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

    updateErasureSettings: (
      context,
      { erasure }: { erasure: Partial<ErasureSettings> },
    ) => {
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

    clearCursor: (context) => {
      if (isInitialStore(context)) return;
      return {
        ...context,
        interaction: { ...context.interaction, cursorPosition: null },
      };
    },

    setCursorPosition: (
      context,
      {
        cursorPosition,
      }: { cursorPosition: { clientX: number; clientY: number } },
    ) => {
      if (isInitialStore(context)) return;
      return {
        ...context,
        interaction: { ...context.interaction, cursorPosition: cursorPosition },
      };
    },

    setIsPressed: (context, { isPressed }: { isPressed: boolean }) => {
      if (isInitialStore(context)) return;
      return {
        ...context,
        interaction: { ...context.interaction, isPressed },
      };
    },

    setIsSpacePressed: (
      context,
      { isSpacePressed }: { isSpacePressed: boolean },
    ) => {
      if (isInitialStore(context)) return;
      return {
        ...context,
        interaction: { ...context.interaction, isSpacePressed },
      };
    },

    completeClaim: (context, _, enqueue) => {
      if (isInitialStore(context)) return;

      if (context.activeAction?.type !== "claimer-active") {
        throw new Error(
          "Attempted to complete a claim when there isn't on active",
        );
      }

      const rects = [...context.activeAction.rects];
      if (context.activeAction.nextRect != null) {
        rects.push(context.activeAction.nextRect);
      }

      context.queryClient.refetchQueries({ queryKey: ["user", "plots"] });
      enqueue.effect(() => store.trigger.redrawTelegraph());

      return {
        ...context,
        actions: context.actions.concat(
          completeRectangleClaimerAction(
            getCompositePolygons(
              rects.map((rect) => rectToPolygonSchema.parse(rect)),
            ),
          ),
        ),
        activeAction: null,
      };
    },

    //////////////////////////////////////////////
    // Event handlers
    //////////////////////////////////////////////

    onPointerDown: (context, { e }: { e: PointerEvent }, enqueue) => {
      if (isInitialStore(context)) return;

      enqueue.effect(() => store.trigger.setIsPressed({ isPressed: true }));

      if (context.interaction.isSpacePressed) {
        return PanTool.onPointerDown(e, context);
      }
      const tool = context.toolSettings.currentTool;

      if (tool === "brush") {
        return BrushTool.onPointerDown(e, context, enqueue);
      }

      if (tool === "erasure") {
        return ErasureTool.onPointerDown(e, context, enqueue);
      }

      if (tool === "claimer") {
        return ClaimerTool.onPointerDown(e, context, enqueue);
      }

      return context;
    },

    onPointerMove: (context, { e }: { e: PointerEvent }, enqueue) => {
      if (isInitialStore(context)) return;

      enqueue.effect(() => {
        store.trigger.setCursorPosition({ cursorPosition: e });
        store.trigger.redrawTelegraph();
      });
      const tool = context.toolSettings.currentTool;

      if (tool === "brush") {
        return BrushTool.onPointerMove(e, context, enqueue);
      }

      if (tool === "erasure") {
        return ErasureTool.onPointerMove(e, context, enqueue);
      }

      if (tool === "claimer") {
        return ClaimerTool.onPointerMove(e, context, enqueue);
      }

      return context;
    },

    onPointerUp: (context, { e }: { e: PointerEvent }, enqueue) => {
      if (isInitialStore(context)) return;

      enqueue.effect(() => {
        return store.trigger.setIsPressed({ isPressed: false });
      });
      const tool = context.toolSettings.currentTool;

      if (tool === "brush") {
        return BrushTool.onPointerUp(e, context, enqueue);
      }

      if (tool === "erasure") {
        return ErasureTool.onPointerUp(e, context, enqueue);
      }

      if (tool === "claimer") {
        return ClaimerTool.onPointerUp(e, context, enqueue);
      }

      return context;
    },

    onPointerOut: (context, { e }: { e: PointerEvent }, enqueue) => {
      if (isInitialStore(context)) return;

      enqueue.effect(() => store.trigger.setIsPressed({ isPressed: false }));
      enqueue.effect(() => store.trigger.clearCursor());
      const tool = context.toolSettings.currentTool;

      if (tool === "brush") {
        return BrushTool.onPointerOut(e, context, enqueue);
      }

      if (tool === "erasure") {
        return ErasureTool.onPointerOut(e, context, enqueue);
      }

      if (tool === "claimer") {
        return ClaimerTool.onPointerOut(e, context, enqueue);
      }

      return context;
    },

    onKeyDown: (context, { e }: { e: KeyboardEvent }, enqueue) => {
      if (isInitialStore(context)) return;
      if (e.defaultPrevented) return;

      if (e.metaKey && e.key === "z") {
        if (e.shiftKey) {
          enqueue.effect(() => store.trigger.redo());
        } else {
          enqueue.effect(() => store.trigger.undo());
        }
      }

      if (e.code === KeyboardCode.Space) {
        return {
          ...context,
          interaction: { ...context.interaction, isSpacePressed: true },
        };
      }
      return context;
    },

    onKeyUp: (context, { e }: { e: KeyboardEvent }) => {
      if (isInitialStore(context)) return;
      if (e.defaultPrevented) return;

      if (e.code === KeyboardCode.Space) {
        return {
          ...context,
          interaction: { ...context.interaction, isSpacePressed: false },
        };
      }
      return context;
    },

    onWheel: (context, { e }: { e: WheelEvent }, enqueue) => {
      if (isInitialStore(context)) return;

      WheelTool.onWheel(context, e, enqueue);

      enqueue.effect(() => {
        store.trigger.resizeRealtimeAndTelegraphCanvases();
        store.trigger.redrawRealtimeCanvas();
        store.trigger.redrawTelegraph();
      });
      const tool = context.toolSettings.currentTool;

      if (tool === "brush") {
        return BrushTool.onWheel(e, context, enqueue);
      }

      if (tool === "erasure") {
        return ErasureTool.onWheel(e, context, enqueue);
      }

      if (tool === "claimer") {
        return ClaimerTool.onWheel(e, context, enqueue);
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
        store.trigger.redrawRealtimeCanvas();
        store.trigger.redrawTelegraph();
      });

      return context;
    },
  },
});
