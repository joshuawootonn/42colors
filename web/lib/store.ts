import { createStore } from "@xstate/store";
import { Channel, Socket } from "phoenix";
import { PencilTool } from "./tools/pencil";
import { BrushTool, pointsToPixels } from "./tools/brush";
import { PanTool } from "./tools/pan";
import { QueryClient } from "@tanstack/react-query";
import { CHUNK_LENGTH } from "./constants";
import { fetchPixels7 } from "./fetch-pixels";
import {
  createBackgroundCanvas,
  drawBackgroundCanvas,
  resizeBackgroundCanvas,
} from "./background";
import {
  ChunkCanvases,
  clearChunkPixels,
  createChunkCanvas,
  drawToChunkCanvas,
  getChunkKey,
  unsetChunkPixels,
} from "./chunk";
import { getLastPixelValue, Pixel, pixelSchema } from "./coord";
import { draw } from "./draw";
import { setupChannel, setupSocketConnection } from "./sockets";
import { fetchAuthedUser, fetchAuthURL } from "./user";
import { KeyboardCode } from "./keyboard-codes";
import { isInitialStore } from "./utils/is-initial-store";
import { WheelTool } from "./tools/wheel";
import {
  createRealtimeCanvas,
  redrawRealtimePixels,
  resizeRealtimeCanvas,
} from "./realtime";
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
import { ColorRef, TRANSPARENT_REF } from "./palette";
import { ErasureTool } from "./tools/erasure";
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
import { createTelegraphCanvas, resizeTelegraphCanvas } from "./telegraph";
import { ClaimerTool } from "./tools/claimer";

export type Tool = "pencil" | "brush" | "erasure" | "claimer";
export type PointerState = "default" | "pressed";

export type InitialStore = {
  state: "initial";
  id: undefined;
  camera: Camera;
  server?: undefined;
  tools?: undefined;
  currentTool: Tool;
  currentColorRef: ColorRef;
  currentPointerState: PointerState;
  realtime?: undefined;
  interaction?: undefined;
  canvas?: undefined;
  user?: undefined;
  actions?: undefined;
  activeAction?: undefined;
  queryClient?: QueryClient;
  eventLoopRafId?: number;
};

export type InitializedStore = {
  state: "initialized";
  camera: Camera;
  server: {
    apiOrigin: string;
    websocketOriginURL: string;
    authURL?: string;
    socket: Socket;
    channel: Channel;
  };
  tools: {
    pencilTool: PencilTool;
    brushTool: BrushTool;
    erasureTool: ErasureTool;
    claimerTool: ClaimerTool;
    panTool: PanTool;
    wheelTool: WheelTool;
  };
  currentColorRef: ColorRef;
  currentTool: Tool;
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
    name: string;
    id: number;
  };
  queryClient: QueryClient;
  eventLoopRafId?: number;
};

export type Store = InitialStore | InitializedStore;

const initialCamera: Camera = { x: 0, y: 0, zoom: 100 };

const initialialStoreContext: Store = {
  state: "initial",
  camera: initialCamera,
  currentTool: "brush",
  currentColorRef: 1,
  currentPointerState: "default",
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

      const telegraphCanvas = createTelegraphCanvas();
      const telegraphCanvasContext = telegraphCanvas.getContext("2d")!;
      telegraphCanvasContext.imageSmoothingEnabled = false;

      const socket = setupSocketConnection(event.apiWebsocketOrigin);
      const channel = setupChannel(socket);

      enqueue.effect(() => {
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
        store.trigger.fetchPixels();
        store.trigger.fetchAuthURL();
        store.trigger.fetchUser();
      });

      return {
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
          socket,
          channel,
        },
        tools: {
          erasureTool: ErasureTool,
          brushTool: BrushTool,
          pencilTool: PencilTool,
          claimerTool: ClaimerTool,
          panTool: PanTool,
          wheelTool: WheelTool,
        },
        interaction: {
          isPressed: false,
          isSpacePressed: false,
          cursorPosition: null,
        },
        actions: [],
        activeAction: null,
        pixels: [],
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
          chunkCanvases: {},
        },
        queryClient: event.queryClient,
      };
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
      event: { user: { email: string; name: string; id: number } },
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
            queryKey: ["user"],
            queryFn: () => fetchAuthedUser(context.server.apiOrigin),
          })
          .then((user) => store.trigger.setUser({ user })),
      );
    },

    setAuthURL: (context, { authURL }: { authURL: string }) => {
      if (isInitialStore(context)) return;
      return {
        ...context,
        server: { ...context.server, authURL },
      };
    },

    fetchAuthURL: (context, _, enqueue) => {
      if (isInitialStore(context)) return;
      enqueue.effect(() =>
        context.queryClient
          .fetchQuery({
            queryKey: ["auth_url"],
            queryFn: () => fetchAuthURL(context.server.apiOrigin),
          })
          .then((authURL) => store.trigger.setAuthURL({ authURL })),
      );
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
      resizeTelegraphCanvas(context.canvas.telegraphCanvas);
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
      clearChunkPixels(context.canvas.chunkCanvases, dedupedPixels);
    },

    redrawTelegraph: (context) => {
      if (isInitialStore(context)) return;
      if (context.interaction.cursorPosition == null) return;

      const tool = context.currentTool;
      switch (tool) {
        case "pencil":
          context.tools.pencilTool.redrawTelegraph(
            context.interaction.cursorPosition.clientX,
            context.interaction.cursorPosition.clientY,
            context,
          );
          break;
        case "erasure":
          context.tools.erasureTool.redrawTelegraph(
            context.interaction.cursorPosition.clientX,
            context.interaction.cursorPosition.clientY,
            context,
          );
          break;
        case "brush":
          context.tools.brushTool.redrawTelegraph(
            context.interaction.cursorPosition.clientX,
            context.interaction.cursorPosition.clientY,
            context,
          );
          break;

        case "claimer":
          context.tools.claimerTool.redrawTelegraph(context);
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
      return { ...context, currentTool: event.tool };
    },

    setCurrentColor: (context, { colorRef }: { colorRef: ColorRef }) => {
      if (isInitialStore(context)) return;
      return {
        ...context,
        currentColorRef: colorRef,
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

    onPointerDown: (context, { e }: { e: PointerEvent }, enqueue) => {
      if (isInitialStore(context)) return;

      enqueue.effect(() => store.trigger.setIsPressed({ isPressed: true }));

      if (context.interaction.isSpacePressed) {
        context.tools.panTool.onPointerDown(e, context);
        return;
      }

      if (context.currentTool === "brush") {
        return context.tools.brushTool.onPointerDown(e, context, enqueue);
      }

      if (context.currentTool === "erasure") {
        return context.tools.erasureTool.onPointerDown(e, context, enqueue);
      }

      if (context.currentTool === "claimer") {
        return context.tools.claimerTool.onPointerDown(e, context, enqueue);
      }
    },

    onPointerMove: (context, { e }: { e: PointerEvent }, enqueue) => {
      if (isInitialStore(context)) return;

      enqueue.effect(() => {
        store.trigger.setCursorPosition({ cursorPosition: e });
        store.trigger.redrawTelegraph();
      });
      const tool = context.currentTool;
      if (tool === "pencil") {
        context.tools.pencilTool.onPointerMove(e, context, enqueue);
      }

      if (tool === "brush") {
        return context.tools.brushTool.onPointerMove(e, context, enqueue);
      }

      if (tool === "erasure") {
        return context.tools.erasureTool.onPointerMove(e, context, enqueue);
      }

      if (tool === "claimer") {
        return context.tools.claimerTool.onPointerMove(e, context, enqueue);
      }
    },

    onPointerUp: (context, { e }: { e: PointerEvent }, enqueue) => {
      if (isInitialStore(context)) return;

      enqueue.effect(() => {
        return store.trigger.setIsPressed({ isPressed: false });
      });

      if (context.currentTool === "brush") {
        return context.tools.brushTool.onPointerUp(e, context, enqueue);
      }

      if (context.currentTool === "erasure") {
        return context.tools.erasureTool.onPointerUp(e, context, enqueue);
      }

      if (context.currentTool === "claimer") {
        return context.tools.claimerTool.onPointerUp(e, context, enqueue);
      }
    },

    onPointerOut: (context, { e }: { e: PointerEvent }, enqueue) => {
      if (isInitialStore(context)) return;

      enqueue.effect(() => store.trigger.setIsPressed({ isPressed: false }));
      enqueue.effect(() => store.trigger.clearCursor());

      if (context.currentTool === "brush") {
        return context.tools.brushTool.onPointerOut(e, context, enqueue);
      }

      if (context.currentTool === "erasure") {
        return context.tools.erasureTool.onPointerOut(e, context, enqueue);
      }

      if (context.currentTool === "claimer") {
        return context.tools.claimerTool.onPointerOut(e, context, enqueue);
      }
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

      context.tools.wheelTool.onWheel(context, e, enqueue);

      enqueue.effect(() => {
        store.trigger.resizeRealtimeAndTelegraphCanvases();
        store.trigger.redrawRealtimeCanvas();
        store.trigger.redrawTelegraph();
      });
      if (context.currentTool === "brush") {
        return context.tools.brushTool.onWheel(e, context, enqueue);
      }

      if (context.currentTool === "erasure") {
        return context.tools.erasureTool.onWheel(e, context, enqueue);
      }

      if (context.currentTool === "claimer") {
        return context.tools.claimerTool.onWheel(e, context, enqueue);
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
    },
  },
});
