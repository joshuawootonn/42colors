import isHotkey from 'is-hotkey';
import { Channel, Socket } from 'phoenix';

import { QueryClient } from '@tanstack/react-query';
import { createStore } from '@xstate/store';

import {
    Action,
    derivePixelsFromActions,
    getActionToRedo,
    getActionToUndo,
    resolveActions,
} from './actions';
import authService from './auth';
import { Camera } from './camera';
import { centerCameraOnPoint } from './camera-utils';
import {
    drawBackgroundCanvas,
    resizeBackgroundCanvas,
} from './canvas/background';
import {
    ChunkCanvases,
    cleanupChunkWebGPU,
    clearChunkCanvas,
    clearChunkPixels,
    createChunkCanvas,
    createUIChunkCanvas,
    drawPixelsToChunkCanvas,
    getChunkKey,
    initializeChunkWebGPU,
} from './canvas/chunk';
import { draw } from './canvas/draw';
import { resizeFullsizeCanvas } from './canvas/fullsize';
import { resizeRealtimeCanvas } from './canvas/realtime';
import { CHUNK_LENGTH } from './constants';
import {
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
} from './events';
import { fetchPixels } from './fetch-pixels';
import { Pixel, getLastPixelValue } from './geometry/coord';
import {
    getCenterPoint,
    getCompositePolygons,
    polygonSchema,
    rectToPolygonSchema,
} from './geometry/polygon';
import { KeyboardCode } from './keyboard-codes';
import { COLOR_ORDER, TRANSPARENT_REF } from './palette';
import { newPixels, setupChannel, setupSocketConnection } from './sockets';
import {
    DEFAULT_TOOL_SETTINGS,
    Tool,
    ToolSettings,
    updateToolSettings,
} from './tool-settings';
import { BrushSettings, BrushTool, pointsToPixels } from './tools/brush/brush';
import { clampBrushSize } from './tools/brush/brush-utils';
import {
    ClaimerTool,
    completeRectangleClaimerAction,
} from './tools/claimer/claimer';
import {
    Plot,
    getPlotsByChunk,
    getUserPlots,
} from './tools/claimer/claimer.rest';
import { ErasureTool } from './tools/erasure/erasure';
import { ErasureSettings } from './tools/erasure/erasure';
import { clampErasureSize } from './tools/erasure/erasure-utils';
import { PaletteSettings } from './tools/palette';
import { PanTool } from './tools/pan';
import { WheelTool } from './tools/wheel';
import { isInitialStore } from './utils/is-initial-store';
import { uuid } from './utils/uuid';
import { WebGPUManager } from './webgpu/web-gpu-manager';

export type InitialStore = {
    state: 'initial';
    camera: Camera;
    currentTool: Tool;
    currentColorRef: number;
    toolSettings: ToolSettings;
    id: undefined;
    interaction: undefined;
    queryClient: undefined;
    user: undefined;
    activeAction: undefined;
};

export type InitializedStore = {
    state: 'initialized';
    camera: Camera;
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
        realtimeCanvas: HTMLCanvasElement;
        telegraphCanvas: HTMLCanvasElement;
        uiCanvas: HTMLCanvasElement;
        chunkCanvases: ChunkCanvases;
        uiWebGPUManager: WebGPUManager;
        telegraphWebGPUManager: WebGPUManager;
        realtimeWebGPUManager: WebGPUManager;
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
    zoom: process.env.NODE_ENV === 'development' ? 500 : 100,
};

const initialialStoreContext: Store = {
    id: undefined,
    state: 'initial',
    camera: initialCamera,
    currentTool: 'brush',
    currentColorRef: 1,
    toolSettings: DEFAULT_TOOL_SETTINGS,
    interaction: undefined,
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
                rootCanvasContext: CanvasRenderingContext2D;
                backgroundCanvas: HTMLCanvasElement;
                backgroundCanvasContext: CanvasRenderingContext2D;
                realtimeCanvas: HTMLCanvasElement;
                telegraphCanvas: HTMLCanvasElement;
                uiCanvas: HTMLCanvasElement;
                uiWebGPUManager: WebGPUManager;
                telegraphWebGPUManager: WebGPUManager;
                realtimeWebGPUManager: WebGPUManager;
            },
            enqueue,
        ) => {
            if (!isInitialStore(context)) return;

            enqueue.effect(() => {
                store.trigger.fetchPixels();
                store.trigger.fetchUser();

                // todo(josh): why is this different?
                event.queryClient.fetchQuery({
                    queryKey: ['user', 'plots'],
                    queryFn: getUserPlots,
                });
            });

            const initialized: InitializedStore = {
                ...context,
                state: 'initialized' as const,
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
                    rootCanvasContext: event.rootCanvasContext,
                    backgroundCanvas: event.backgroundCanvas,
                    backgroundCanvasContext: event.backgroundCanvasContext,
                    realtimeCanvas: event.realtimeCanvas,
                    telegraphCanvas: event.telegraphCanvas,
                    uiCanvas: event.uiCanvas,
                    chunkCanvases: {},
                    uiWebGPUManager: event.uiWebGPUManager,
                    telegraphWebGPUManager: event.telegraphWebGPUManager,
                    realtimeWebGPUManager: event.realtimeWebGPUManager,
                },
                queryClient: event.queryClient,
            };

            return initialized;
        },

        listen: (
            _context,
            {
                element,
                body,
            }: { element: HTMLCanvasElement; body: HTMLBodyElement },
        ) => {
            element.addEventListener('wheel', onWheel);
            body.addEventListener('keydown', onKeyDown);
            body.addEventListener('keyup', onKeyUp);
            window.addEventListener('resize', onResize);
            element.addEventListener('pointermove', onPointerMove);
            element.addEventListener('pointerdown', onPointerDown);
            element.addEventListener('pointerup', onPointerUp);
            element.addEventListener('pointerout', onPointerOut);

            body.addEventListener('touchstart', onTouch, true);
            body.addEventListener('touchmove', onTouch, true);

            body.addEventListener('gesturestart', onGesture, true);
            body.addEventListener('gesturemove', onGesture, true);
            body.addEventListener('gestureend', onGesture, true);
        },

        unlisten: (
            context,
            {
                element,
                body,
            }: { element: HTMLCanvasElement; body: HTMLBodyElement },
        ) => {
            element.removeEventListener('wheel', onWheel);
            body.removeEventListener('keydown', onKeyDown);
            body.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('resize', onResize);
            element.removeEventListener('pointermove', onPointerMove);
            element.removeEventListener('pointerdown', onPointerDown);
            element.removeEventListener('pointerup', onPointerUp);
            element.removeEventListener('pointerout', onPointerOut);

            body.removeEventListener('touchstart', onTouch, true);
            body.removeEventListener('touchmove', onTouch, true);

            body.removeEventListener('gesturestart', onGesture, true);
            body.removeEventListener('gesturemove', onGesture, true);
            body.removeEventListener('gestureend', onGesture, true);

            if (!isInitialStore(context)) {
                Object.values(context.canvas.chunkCanvases).forEach((chunk) => {
                    cleanupChunkWebGPU(chunk.webgpuManager);
                });
            }
        },

        newRealtimePixels: (context, event: { pixels: Pixel[] }, _enqueue) => {
            if (isInitialStore(context)) return;

            clearChunkPixels(context.canvas.chunkCanvases, event.pixels);

            return {
                ...context,
                actions: context.actions.concat({
                    type: 'realtime-active',
                    pixels: event.pixels,
                }),
            };
        },

        newPixels: (context, event: { pixels: Pixel[] }) => {
            if (isInitialStore(context)) return;

            newPixels(context, event.pixels);

            return context;
        },

        undo: (context, _, _enqueue) => {
            if (isInitialStore(context)) return;

            const actionToUndo = getActionToUndo(context.actions);

            const nextActions = context.actions.concat({ type: 'undo' });

            if (actionToUndo == null) {
                return {
                    ...context,
                    actions: nextActions,
                };
            }

            const pixels = pointsToPixels(
                actionToUndo.points,
                actionToUndo.type === 'erasure-active'
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
                        context.canvas.chunkCanvases[
                            getChunkKey(pixel.x, pixel.y)
                        ].pixels,
                        pixel,
                    ) ??
                    ({
                        x: pixel.x,
                        y: pixel.y,
                        colorRef: 0,
                    } as Pixel);
                next.push(lastPixelValue);
            }

            newPixels(context, next);

            return {
                ...context,
                actions: nextActions,
            };
        },

        redo: (context, _, _enqueue) => {
            if (isInitialStore(context)) return;

            const nextActions = context.actions.concat({ type: 'redo' });

            const actionToRedo = getActionToRedo(context.actions);

            if (actionToRedo == null) {
                return {
                    ...context,
                    actions: nextActions,
                };
            }

            const pixels = pointsToPixels(
                actionToRedo.points,
                actionToRedo.type === 'erasure-active'
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
                        context.canvas.chunkCanvases[
                            getChunkKey(pixel.x, pixel.y)
                        ].pixels,
                        pixel,
                    ) ??
                    ({
                        x: pixel.x,
                        y: pixel.y,
                        colorRef: 0,
                    } as Pixel);
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
                user: {
                    email: string;
                    id: number;
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

            return {
                ...context,
                server: {
                    ...context.server,
                    socket,
                    channel,
                },
            };
        },

        fetchUser: (context, _, enqueue) => {
            if (isInitialStore(context)) return;
            enqueue.effect(() =>
                context.queryClient
                    .fetchQuery({
                        queryKey: ['user', 'me'],
                        queryFn: () =>
                            authService.getCurrentUser(
                                context.server.apiOrigin,
                            ),
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
                        context.canvas.chunkCanvases[
                            `x: ${chunkX} y: ${chunkY}`
                        ] != null
                    ) {
                        console.log(
                            `skipping fetch for cached chunk x: ${chunkX} y: ${chunkY}`,
                        );
                        continue;
                    }
                    const chunkKey = getChunkKey(chunkX, chunkY);

                    const canvas = createChunkCanvas();
                    const canvasContext = canvas.getContext('2d');
                    canvasContext!.imageSmoothingEnabled = false;

                    console.log('setting chunk canvases', context.state);

                    context.canvas.chunkCanvases[chunkKey] = {
                        element: canvas,
                        context: canvasContext!,
                        x: chunkX,
                        y: chunkY,
                        pixels: [],
                        plots: [],
                        renderConditions: { zoom: context.camera.zoom },
                        webgpuManager: null,
                    };

                    enqueue.effect(async () => {
                        context.queryClient
                            .fetchQuery({
                                queryKey: ['pixels', chunkKey],
                                queryFn: () =>
                                    fetchPixels(
                                        context.server.apiOrigin,
                                        chunkX,
                                        chunkY,
                                    ),
                            })
                            .then((pixels) =>
                                store.trigger.addPixels({ chunkKey, pixels }),
                            );

                        context.queryClient
                            .fetchQuery({
                                queryKey: ['plots', chunkKey],
                                queryFn: () => getPlotsByChunk(chunkX, chunkY),
                            })
                            .then((plots) =>
                                store.trigger.addPlots({
                                    chunkKey,
                                    plots: plots.map((plot) => ({
                                        ...plot,
                                        polygon: polygonSchema.parse({
                                            vertices: plot.polygon.vertices.map(
                                                (vertex) => {
                                                    return [
                                                        vertex[0] - chunkX,
                                                        vertex[1] - chunkY,
                                                    ];
                                                },
                                            ),
                                        }),
                                    })),
                                }),
                            );
                        try {
                            const webgpuCanvas = createUIChunkCanvas();
                            const webgpuManager =
                                await initializeChunkWebGPU(webgpuCanvas);

                            if (
                                webgpuManager &&
                                context.canvas.chunkCanvases[chunkKey]
                            ) {
                                store.trigger.setChunkWebGPUManager({
                                    chunkKey,
                                    webgpuManager,
                                    webgpuCanvas,
                                });

                                console.log(
                                    `WebGPU manager initialized for chunk ${chunkKey}`,
                                );
                            } else {
                                throw new Error(
                                    `WebGPU manager initialization failed for chunk ${chunkKey}`,
                                );
                            }
                        } catch (error) {
                            console.warn(
                                `Error initializing WebGPU manager for chunk ${chunkKey}:`,
                                error,
                            );
                        }
                    });
                }
            }
            return context;
        },

        setChunkWebGPUManager: (
            context,
            {
                chunkKey,
                webgpuManager,
                webgpuCanvas,
            }: {
                chunkKey: string;
                webgpuManager: WebGPUManager;
                webgpuCanvas: HTMLCanvasElement;
            },
            _enqueue,
        ) => {
            if (isInitialStore(context)) return;

            const prev = context.canvas.chunkCanvases[chunkKey];

            if (prev == null) {
                console.log(
                    `skipping set chunk webgpu manager on uninitialized chunk, chunkKey: ${chunkKey}`,
                );
                return;
            }

            return {
                ...context,
                canvas: {
                    ...context.canvas,
                    chunkCanvases: {
                        ...context.canvas.chunkCanvases,
                        [chunkKey]: { ...prev, webgpuManager, webgpuCanvas },
                    },
                },
            };
        },

        updateChunk: (
            context,
            {
                chunkKey,
                pixels,
                plots,
            }: { chunkKey: string; pixels?: Pixel[]; plots?: Plot[] },
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
                pixels: pixels ? [...prev.pixels, ...pixels] : prev.pixels,
                plots: plots ? [...prev.plots, ...plots] : prev.plots,
            };

            enqueue.effect(() => {
                if (pixels) {
                    store.trigger.drawPixelsToChunkCanvas({ chunkKey, pixels });
                }
            });
        },

        addPixels: (
            context,
            { chunkKey, pixels }: { chunkKey: string; pixels: Pixel[] },
            enqueue,
        ) => {
            if (isInitialStore(context)) return;

            const prev = context.canvas.chunkCanvases[chunkKey];

            if (prev == null) {
                console.log(
                    `skipping add pixels on uninitialized chunk, chunkKey: ${chunkKey}`,
                );
                return;
            }

            context.canvas.chunkCanvases[chunkKey] = {
                ...prev,
                pixels: [...prev.pixels, ...pixels],
            };

            enqueue.effect(() => {
                store.trigger.redrawChunk({ chunkKey });
            });
        },

        addPlots: (
            context,
            { chunkKey, plots }: { chunkKey: string; plots: Plot[] },
            enqueue,
        ) => {
            if (isInitialStore(context)) return;

            const prev = context.canvas.chunkCanvases[chunkKey];

            if (prev == null) {
                console.log(
                    `skipping add plots on uninitialized chunk, chunkKey: ${chunkKey}`,
                );
                return;
            }

            context.canvas.chunkCanvases[chunkKey] = {
                ...prev,
                plots: [...prev.plots, ...plots],
            };

            enqueue.effect(() => {
                store.trigger.redrawChunk({ chunkKey });
            });
        },

        removePixels: (
            context,
            { chunkKey, pixelIds }: { chunkKey: string; pixelIds: string[] },
            enqueue,
        ) => {
            if (isInitialStore(context)) return;

            const prev = context.canvas.chunkCanvases[chunkKey];

            if (prev == null) {
                console.log(
                    `skipping remove pixels on uninitialized chunk, chunkKey: ${chunkKey}`,
                );
                return;
            }

            const pixelIdSet = new Set(pixelIds);
            const remainingPixels = prev.pixels.filter(
                (pixel) => !pixelIdSet.has(`${pixel.x},${pixel.y}`),
            );

            context.canvas.chunkCanvases[chunkKey] = {
                ...prev,
                pixels: remainingPixels,
            };

            enqueue.effect(() => {
                store.trigger.redrawChunk({ chunkKey });
            });
        },

        removePlots: (
            context,
            { chunkKey, plotIds }: { chunkKey: string; plotIds: number[] },
            enqueue,
        ) => {
            console.log('removePlots', chunkKey, plotIds);
            if (isInitialStore(context)) return;

            const prev = context.canvas.chunkCanvases[chunkKey];

            if (prev == null) {
                console.log(
                    `skipping remove plots on uninitialized chunk, chunkKey: ${chunkKey}`,
                );
                return;
            }

            const plotIdSet = new Set(plotIds);
            const remainingPlots = prev.plots.filter(
                (plot) => !plotIdSet.has(plot.id),
            );

            console.log({
                remainingPlots,
                prevPlots: prev.plots,
                chunkCanvases: context.canvas.chunkCanvases,
                plotIdSet,
                chunkKey,
            });

            context.canvas.chunkCanvases[chunkKey] = {
                ...prev,
                plots: remainingPlots,
            };

            enqueue.effect(() => {
                store.trigger.redrawChunk({ chunkKey });
            });
        },

        redrawChunk: (context, { chunkKey }: { chunkKey: string }, enqueue) => {
            if (isInitialStore(context)) return;
            enqueue.effect(() => {
                store.trigger.clearChunk({ chunkKey });
                store.trigger.drawPixelsToChunkCanvas({
                    chunkKey,
                    pixels: context.canvas.chunkCanvases[chunkKey].pixels,
                });
            });
        },

        resizeRealtimeAndTelegraphCanvases: (context) => {
            if (isInitialStore(context)) return;
            resizeRealtimeCanvas(context.canvas.realtimeCanvas, context.camera);
            resizeFullsizeCanvas(context.canvas.telegraphCanvas);
            resizeFullsizeCanvas(context.canvas.uiCanvas);
        },

        clearChunk: (context, { chunkKey }: { chunkKey: string }, enqueue) => {
            if (isInitialStore(context)) return;
            enqueue.effect(() => {
                clearChunkCanvas(context.canvas.chunkCanvases, chunkKey);
            });
        },

        drawPixelsToChunkCanvas: (
            context,
            event: { chunkKey: string; pixels: Pixel[] },
        ) => {
            if (isInitialStore(context)) return;
            drawPixelsToChunkCanvas(
                context.canvas.chunkCanvases[event.chunkKey].element,
                context.canvas.chunkCanvases[event.chunkKey].context,
                event.pixels,
            );
        },

        moveCamera: (
            context,
            event: {
                camera: Partial<Camera>;
                options?: { deselectPlot: boolean };
            },
            enqueue,
        ) => {
            if (isInitialStore(context)) return;

            const options = { deselectPlot: true, ...event.options };

            enqueue.effect(() => {
                store.trigger.resizeRealtimeAndTelegraphCanvases();
                if (options.deselectPlot) {
                    store.trigger.deselectPlot();
                }
            });

            return {
                ...context,
                camera: { ...context.camera, ...event.camera },
            };
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

        clearClaim: (context) => {
            if (isInitialStore(context)) return;
            return {
                ...context,
                activeAction: null,
            };
        },

        completeClaim: (context) => {
            if (isInitialStore(context)) return;

            if (context.activeAction?.type !== 'claimer-active') {
                throw new Error(
                    "Attempted to complete a claim when there isn't on active",
                );
            }

            const rects = [...context.activeAction.rects];
            if (context.activeAction.nextRect != null) {
                rects.push(context.activeAction.nextRect);
            }

            context.queryClient.refetchQueries({ queryKey: ['user', 'plots'] });

            return {
                ...context,
                actions: context.actions.concat(
                    completeRectangleClaimerAction(
                        getCompositePolygons(
                            rects.map((rect) =>
                                rectToPolygonSchema.parse(rect),
                            ),
                        ),
                    ),
                ),
                activeAction: null,
            };
        },

        selectPlot: (context, { plotId }: { plotId: number }, enqueue) => {
            if (isInitialStore(context)) return;

            const plots = context.queryClient.getQueryData([
                'user',
                'plots',
            ]) as Plot[];

            enqueue.effect(() => {
                store.trigger.moveCamera({
                    camera: centerCameraOnPoint(
                        getCenterPoint(
                            plots.find((plot) => plot.id === plotId)!.polygon,
                        ),
                        store.getSnapshot().context.camera,
                    ),
                    options: { deselectPlot: false },
                });
            });

            return {
                ...context,
                toolSettings: {
                    ...context.toolSettings,
                    claimer: { selectedPlotId: plotId },
                },
            };
        },

        deselectPlot: (context) => {
            if (isInitialStore(context)) return;
            return {
                ...context,
                toolSettings: {
                    ...context.toolSettings,
                    claimer: { selectedPlotId: undefined },
                },
            };
        },

        //////////////////////////////////////////////
        // Event handlers
        //////////////////////////////////////////////

        onPointerDown: (context, { e }: { e: PointerEvent }, enqueue) => {
            if (isInitialStore(context)) return;

            enqueue.effect(() =>
                store.trigger.setIsPressed({ isPressed: true }),
            );

            if (context.interaction.isSpacePressed) {
                return PanTool.onPointerDown(e, context);
            }
            const tool = context.toolSettings.currentTool;

            if (tool === Tool.Brush) {
                return BrushTool.onPointerDown(e, context, enqueue);
            }

            if (tool === Tool.Erasure) {
                return ErasureTool.onPointerDown(e, context, enqueue);
            }

            if (tool === Tool.Claimer) {
                return ClaimerTool.onPointerDown(e, context, enqueue);
            }

            return context;
        },

        onPointerMove: (context, { e }: { e: PointerEvent }, enqueue) => {
            if (isInitialStore(context)) return;

            enqueue.effect(() => {
                store.trigger.setCursorPosition({ cursorPosition: e });
            });
            const tool = context.toolSettings.currentTool;

            if (tool === Tool.Brush) {
                return BrushTool.onPointerMove(e, context, enqueue);
            }

            if (tool === Tool.Erasure) {
                return ErasureTool.onPointerMove(e, context, enqueue);
            }

            if (tool === Tool.Claimer) {
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

            if (tool === Tool.Brush) {
                return BrushTool.onPointerUp(e, context, enqueue);
            }

            if (tool === Tool.Erasure) {
                return ErasureTool.onPointerUp(e, context, enqueue);
            }

            if (tool === Tool.Claimer) {
                return ClaimerTool.onPointerUp(e, context, enqueue);
            }

            return context;
        },

        onPointerOut: (context, { e }: { e: PointerEvent }, enqueue) => {
            if (isInitialStore(context)) return;

            enqueue.effect(() =>
                store.trigger.setIsPressed({ isPressed: false }),
            );
            enqueue.effect(() => store.trigger.clearCursor());
            const tool = context.toolSettings.currentTool;

            if (tool === Tool.Brush) {
                return BrushTool.onPointerOut(e, context, enqueue);
            }

            if (tool === Tool.Erasure) {
                return ErasureTool.onPointerOut(e, context, enqueue);
            }

            if (tool === Tool.Claimer) {
                return ClaimerTool.onPointerOut(e, context, enqueue);
            }

            return context;
        },

        onKeyDown: (context, { e }: { e: KeyboardEvent }, enqueue) => {
            if (isInitialStore(context)) return;
            if (e.defaultPrevented) return;

            // Undo/Redo shortcuts
            if (isHotkey('mod+shift+z', e)) {
                e.preventDefault();
                enqueue.effect(() => store.trigger.redo());
                return context;
            }

            if (isHotkey('mod+z', e)) {
                e.preventDefault();
                enqueue.effect(() => store.trigger.undo());
                return context;
            }

            // Tool shortcuts (Aseprite-style)
            // Only trigger if target is not an input or contenteditable element
            const target = e.target as HTMLElement;
            const isInputElement =
                target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
            const isContentEditable = target.contentEditable === 'true';

            if (!isInputElement && !isContentEditable) {
                if (isHotkey('b', e)) {
                    e.preventDefault();
                    enqueue.effect(() =>
                        store.trigger.changeTool({ tool: Tool.Brush }),
                    );
                    return context;
                }

                if (isHotkey('e', e)) {
                    e.preventDefault();
                    enqueue.effect(() =>
                        store.trigger.changeTool({ tool: Tool.Erasure }),
                    );
                    return context;
                }

                if (isHotkey('c', e)) {
                    e.preventDefault();
                    enqueue.effect(() =>
                        store.trigger.changeTool({ tool: Tool.Claimer }),
                    );
                    return context;
                }

                // Palette navigation shortcuts
                if (isHotkey('[', e)) {
                    e.preventDefault();
                    const currentColorRef =
                        context.toolSettings.palette.currentColorRef;
                    const currentIndex = COLOR_ORDER.indexOf(currentColorRef);
                    const previousIndex =
                        currentIndex > 0
                            ? currentIndex - 1
                            : COLOR_ORDER.length - 1;
                    const previousColor = COLOR_ORDER[previousIndex];
                    enqueue.effect(() =>
                        store.trigger.updatePaletteSettings({
                            palette: { currentColorRef: previousColor },
                        }),
                    );
                    return context;
                }

                if (isHotkey(']', e)) {
                    e.preventDefault();
                    const currentColorRef =
                        context.toolSettings.palette.currentColorRef;
                    const currentIndex = COLOR_ORDER.indexOf(currentColorRef);
                    const nextIndex =
                        currentIndex < COLOR_ORDER.length - 1
                            ? currentIndex + 1
                            : 0;
                    const nextColor = COLOR_ORDER[nextIndex];
                    enqueue.effect(() =>
                        store.trigger.updatePaletteSettings({
                            palette: { currentColorRef: nextColor },
                        }),
                    );
                    return context;
                }
            }

            // Eraser size shortcuts (Shift + plus/minus)
            if (isHotkey('+', e) || isHotkey('=', e)) {
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

                return context;
            }

            if (isHotkey('-', e) || isHotkey('_', e)) {
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
                return context;
            }

            if (e.code === KeyboardCode.Space) {
                return {
                    ...context,
                    interaction: {
                        ...context.interaction,
                        isSpacePressed: true,
                    },
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
                    interaction: {
                        ...context.interaction,
                        isSpacePressed: false,
                    },
                };
            }
            return context;
        },

        onWheel: (context, { e }: { e: WheelEvent }, enqueue) => {
            if (isInitialStore(context)) return;

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

            if (tool === Tool.Claimer) {
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
            });

            return context;
        },
    },
});
