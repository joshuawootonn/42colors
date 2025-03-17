import { createStore } from "@xstate/store";
import { Channel, Socket } from "phoenix";
import { PencilTool } from "./tools/pencil";
import { BrushTool } from "./tools/brush";
import { PanTool } from "./tools/pan";
import { QueryClient } from "@tanstack/react-query";
import {
  CHUNK_LENGTH,
  X_MIN,
  X_MAX,
  Y_MIN,
  Y_MAX,
  ZOOM_MIN,
  ZOOM_MAX,
} from "./constants";
import { fetchPixels7 } from "./fetch-pixels";
import { createBackgroundCanvas, drawBackgroundCanvas } from "./background";
import { createChunkCanvas, drawToChunkCanvas } from "./chunk";
import { Pixel } from "./pixel";
import { draw } from "./draw";
import { setupChannel, setupSocketConnection } from "./sockets";
import { fetchAuthedUser, fetchAuthURL } from "./user";
import { ErrorCode } from "./error-codes";
import { toast } from "@/components/ui/toast";
import { KeyboardCode } from "./keyboard-codes";
import { clamp } from "./utils/clamp";
import { roundToFive } from "./utils/round-to-five";

export type Camera = { x: number; y: number; zoom: number };

export type Tool = "pencil" | "brush";
export type PointerState = "default" | "pressed";

export type InitialStore = {
  state: "initial";
  camera: { x: number; y: number; zoom: number };
  server?: undefined;
  tools?: undefined;
  currentTool: Tool;
  currentPointerState: PointerState;
  realtime?: undefined;
  interaction?: undefined;
  canvas?: undefined;
  user?: undefined;
  queryClient?: QueryClient;
  eventLoopRafId?: number;
};

export type InitializedStore = {
  state: "initialized";
  camera: { x: number; y: number; zoom: number };
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
    panTool: PanTool;
  };
  currentTool: Tool;
  currentPointerState: PointerState;
  realtimePixels: Pixel[];
  pixels: Pixel[];
  canvas: {
    bodyElement: HTMLBodyElement;
    rootCanvas: HTMLCanvasElement;
    rootCanvasContext: CanvasRenderingContext2D;
    backgroundCanvas: HTMLCanvasElement;
    backgroundCanvasContext: CanvasRenderingContext2D;
    chunkCanvases: Record<
      string,
      {
        element: HTMLCanvasElement;
        context: CanvasRenderingContext2D;
        x: number;
        y: number;
        pixels: [];
        renderConditions: {
          zoom: number;
        };
      }
    >;
  };
  interaction: {
    isPressed: boolean;
    isSpacePressed: boolean;
  };
  user?: {
    email: string;
    name: string;
  };
  queryClient: QueryClient;
  eventLoopRafId?: number;
};

export type Store = InitialStore | InitializedStore;

const initialialStoreContext: Store = {
  state: "initial",
  camera: { x: 0, y: 0, zoom: 100 },
  currentTool: "pencil",
  currentPointerState: "default",
} as Store;

function isInitial(context: Store): context is InitialStore {
  const is = context.state === "initial";

  if (is)
    console.warn("`PencilTool.onPointerDown` attempted in uninitialized state");

  return is;
}

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
        cameraOptions: { x: number; y: number };
        queryClient: QueryClient;
      },
      enqueue,
    ) => {
      const rootCanvasContext = event.canvas.getContext("2d")!;
      rootCanvasContext.imageSmoothingEnabled = false;

      const backgroundCanvas = createBackgroundCanvas();
      const backgroundCanvasContext = backgroundCanvas.getContext("2d")!;
      backgroundCanvasContext.imageSmoothingEnabled = false;
      drawBackgroundCanvas(backgroundCanvas, backgroundCanvasContext);

      const socket = setupSocketConnection(event.apiWebsocketOrigin);
      const channel = setupChannel(socket);

      enqueue.effect(() =>
        channel.on("new_pixel", (payload: { body: Pixel }) => {
          store.trigger.newRealtimePixel({ pixel: payload.body });
        }),
      );

      return {
        ...context,
        state: "initialized" as const,
        camera: {
          ...context.camera,
          x: event.cameraOptions.x,
          y: event.cameraOptions.y,
        },
        server: {
          apiOrigin: event.apiOrigin,
          websocketOriginURL: event.apiWebsocketOrigin,
          socket,
          channel,
        },
        tools: {
          brushTool: BrushTool,
          pencilTool: PencilTool,
          panTool: PanTool,
        },
        interaction: {
          isPressed: false,
          isSpacePressed: false,
        },
        realtimePixels: [],
        pixels: [],
        canvas: {
          bodyElement: event.body,
          rootCanvas: event.canvas,
          rootCanvasContext,
          backgroundCanvas,
          backgroundCanvasContext,
          chunkCanvases: {},
        },
        queryClient: event.queryClient,
      };
    },

    newRealtimePixel: (context, event: { pixel: Pixel }) => {
      if (isInitial(context)) return;

      return {
        ...context,
        realtimePixels: context.realtimePixels.concat(event.pixel),
      };
    },

    newPixel: (context, event: { pixel: Pixel }) => {
      if (isInitial(context)) return;
      const authURL = context.server.authURL;

      context.server.channel
        .push("new_pixel", { body: event.pixel })
        .receive("error", (resp) => {
          if (resp === ErrorCode.UNAUTHED_USER) {
            toast({
              title: "Login (when you are ready)",
              description: "to save and share your pixels.",
              button: authURL
                ? {
                    label: "login",
                    onClick: () => {
                      window.location.href = authURL;
                    },
                  }
                : undefined,
            });
          }
        });

      return {
        ...context,
        pixels: context.pixels.concat(event.pixel),
      };
    },

    setUser: (context, event: { user: { email: string; name: string } }) => {
      if (isInitial(context)) return;
      return {
        ...context,
        user: event.user,
      };
    },

    fetchUser: (context, _, enqueue) => {
      if (isInitial(context)) return;
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
      if (isInitial(context)) return;
      return {
        ...context,
        server: { ...context.server, authURL },
      };
    },

    fetchAuthURL: (context, _, enqueue) => {
      if (isInitial(context)) return;
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
      if (isInitial(context)) return;

      const { x, y } = context.camera;
      const otherX = x + Math.floor(window.innerWidth / 5);
      const otherY = y + Math.floor(window.innerHeight / 5);

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
          const chunkKey = `x: ${chunkX} y: ${chunkY}`;

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
              .then((pixels) => store.trigger.drawPixels({ chunkKey, pixels })),
          );
        }
      }
    },

    drawPixels: (context, event: { chunkKey: string; pixels: Pixel[] }) => {
      if (isInitial(context)) return;
      drawToChunkCanvas(
        context.canvas.chunkCanvases[event.chunkKey].element,
        context.canvas.chunkCanvases[event.chunkKey].context,
        event.pixels,
        context.camera,
      );
    },

    moveCamera: (context, event: { camera: Partial<Camera> }) => {
      if (isInitial(context)) return;

      return { ...context, camera: { ...context.camera, ...event.camera } };
    },

    draw: (context) => {
      if (isInitial(context)) return;
      draw(context);
    },

    changeTool: (context, event: { tool: Tool }) => {
      return { ...context, currentTool: event.tool };
    },

    setIsPressed: (context, { isPressed }: { isPressed: boolean }) => {
      if (isInitial(context)) return;
      return {
        ...context,
        interaction: { ...context.interaction, isPressed },
      };
    },

    setIsSpacePressed: (
      context,
      { isSpacePressed }: { isSpacePressed: boolean },
    ) => {
      if (isInitial(context)) return;
      return {
        ...context,
        interaction: { ...context.interaction, isSpacePressed },
      };
    },

    onPointerUp: (context, _, enqueue) => {
      if (isInitial(context)) return;
      enqueue.effect(() => {
        return store.trigger.setIsPressed({ isPressed: false });
      });
    },

    onPointerOut: (context, _, enqueue) => {
      if (isInitial(context)) return;

      enqueue.effect(() => store.trigger.setIsPressed({ isPressed: false }));
    },

    onPointerDown: (context, { e }: { e: PointerEvent }, enqueue) => {
      if (isInitial(context)) return;

      if (context.interaction.isSpacePressed) {
        context.tools.panTool.onPointerDown(e, context);
        enqueue.effect(() => store.trigger.setIsPressed({ isPressed: true }));
        return;
      }

      const tool = context.currentTool;
      switch (tool) {
        case "pencil":
          context.tools.pencilTool.onPointerDown(e, context);
          break;
        case "brush":
          context.tools.brushTool.onPointerDown(e, context);
          break;

        default:
          console.log("default case of the onPointerDown");
      }
      enqueue.effect(() => store.trigger.setIsPressed({ isPressed: true }));
    },

    onKeyDown: (context, { e }: { e: KeyboardEvent }) => {
      if (isInitial(context)) return;
      if (e.defaultPrevented) return;

      if (e.code === KeyboardCode.Space) {
        return {
          ...context,
          interaction: { ...context.interaction, isSpacePressed: true },
        };
      }
      return context;
    },

    onKeyUp: (context, { e }: { e: KeyboardEvent }) => {
      if (isInitial(context)) return;
      if (e.defaultPrevented) return;

      if (e.code === KeyboardCode.Space) {
        return {
          ...context,
          interaction: { ...context.interaction, isSpacePressed: false },
        };
      }
      return context;
    },

    onWheel: (context, { e }: { e: WheelEvent }) => {
      if (isInitial(context)) return;
      if (e.defaultPrevented) return;

      e.preventDefault();

      const deltaZoom = e.ctrlKey ? e.deltaY * -0.1 : 0;
      const deltaX = e.shiftKey ? e.deltaY : e.deltaX;
      const deltaY = e.shiftKey || e.ctrlKey ? 0 : e.deltaY * 1;

      return {
        ...context,
        camera: {
          ...context.camera,
          zoom: roundToFive(
            clamp(context.camera.zoom + deltaZoom, ZOOM_MIN, ZOOM_MAX),
          ),
          x: roundToFive(clamp(context.camera.x + deltaX, X_MIN, X_MAX)),
          y: roundToFive(clamp(context.camera.y + deltaY, Y_MIN, Y_MAX)),
        },
      };
    },
  },
});
