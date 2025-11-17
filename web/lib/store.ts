import isHotkey from 'is-hotkey';
import { Channel, Socket } from 'phoenix';

import { QueryClient } from '@tanstack/react-query';
import { createStore } from '@xstate/store';

import { ACTION_TYPES } from './action-types';
import {
    Action,
    derivePixelsFromActions,
    getActionToRedo,
    getActionToUndo,
    resolveActions,
} from './actions';
import { isAdminUser } from './admin';
import authService from './auth';
import { Camera } from './camera';
import { centerCameraOnPoint } from './camera-utils';
import {
    drawBackgroundCanvas,
    resizeBackgroundCanvas,
} from './canvas/background';
import { getCameraCenterPoint } from './canvas/canvas';
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
import { showCrosshair } from './canvas/ui';
import {
    CHUNK_LENGTH,
    X_MAX,
    X_MIN,
    Y_MAX,
    Y_MIN,
    ZOOM_MAX,
    ZOOM_MIN,
} from './constants';
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
} from './events';
import { fetchPixels } from './fetch-pixels';
import { bresenhamLine } from './geometry/bresenham-line';
import { Pixel, getLastPixelValue } from './geometry/coord';
import { getCenterPoint, polygonSchema } from './geometry/polygon';
import { Vector } from './geometry/vector';
import { KeyboardCode } from './keyboard-codes';
import { absolutePointTupleToPixels } from './line';
import { TRANSPARENT_REF, getNextColor, getPreviousColor } from './palette';
import { findPlotAtPoint } from './plots/plots.rest';
import { roundTo1Place } from './round-to-five';
import { newPixels, setupChannel, setupSocketConnection } from './sockets';
import {
    DEFAULT_TOOL_SETTINGS,
    Tool,
    ToolSettings,
    updateToolSettings,
} from './tool-settings';
import {
    BrushSettings,
    BrushTool,
    getBrushPoints,
    pointsToPixels,
} from './tools/brush/brush';
import { clampBrushSize } from './tools/brush/brush-utils';
import { BucketTool } from './tools/bucket/bucket';
import {
    ClaimerTool,
    completeRectangleClaimerAction,
    startEditAction,
} from './tools/claimer/claimer';
import {
    Plot,
    getPlotsByChunk,
    getUserPlots,
} from './tools/claimer/claimer.rest';
import { ErasureSettings, ErasureTool } from './tools/erasure/erasure';
import { clampErasureSize } from './tools/erasure/erasure-utils';
import { EyedropperTool } from './tools/eyedropper/eyedropper';
import { LineSettings, LineTool } from './tools/line/line';
import { clampLineSize } from './tools/line/line-utils';
import { PaletteSettings } from './tools/palette';
import { PanTool } from './tools/pan';
import { WheelTool } from './tools/wheel';
import { clamp } from './utils/clamp';
import { isInitialStore } from './utils/is-initial-store';
import { uuid } from './utils/uuid';
import { WebGPUManager } from './webgpu/web-gpu-manager';

type AdminSettings = {
    plotBordersVisible: boolean;
};

export type InitialStore = {
    state: 'initial';
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
    state: 'initialized';
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
    zoom: process.env.NODE_ENV === 'development' ? 500 : 100,
};

const defaultAdminSettings: AdminSettings = {
    plotBordersVisible: true,
};

const initialialStoreContext: Store = {
    id: undefined,
    state: 'initial',
    camera: initialCamera,
    currentTool: 'brush',
    currentColorRef: 1,
    toolSettings: DEFAULT_TOOL_SETTINGS,
    adminSettings: defaultAdminSettings,
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
            element.addEventListener('contextmenu', onContextMenu);

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

        newPixels: (context, event: { pixels: Pixel[]; action_id: string }) => {
            if (isInitialStore(context)) return;

            newPixels(context, event.pixels, event.action_id);

            return context;
        },

        filterPixelsFromActions: (
            context,
            event: { action_id: string; rejected_pixels: Pixel[] },
        ) => {
            if (isInitialStore(context)) return;

            const next_actions = context.actions
                .map((action) => {
                    if (
                        (action.type === ACTION_TYPES.BRUSH_ACTIVE ||
                            action.type === ACTION_TYPES.ERASURE_ACTIVE ||
                            action.type === ACTION_TYPES.LINE_COMPLETE ||
                            action.type === ACTION_TYPES.BUCKET_ACTIVE) &&
                        action.action_id === event.action_id
                    ) {
                        // For LINE_COMPLETE, we need to reconstruct the points
                        if (action.type === ACTION_TYPES.LINE_COMPLETE) {
                            const linePoints = bresenhamLine(
                                action.vector.x,
                                action.vector.y,
                                action.vector.x + action.vector.magnitudeX,
                                action.vector.y + action.vector.magnitudeY,
                            );
                            const brushPoints = getBrushPoints(
                                linePoints,
                                action.size,
                                1,
                            );
                            const rejected_coords = new Set(
                                event.rejected_pixels.map(
                                    (p) => `${p.x},${p.y}`,
                                ),
                            );
                            const filteredBrushPoints = brushPoints.filter(
                                (point) =>
                                    !rejected_coords.has(
                                        `${point.x},${point.y}`,
                                    ),
                            );
                            // Reconstruct vector from filtered points
                            // This is a simplification - we'll use the first and last points
                            if (filteredBrushPoints.length === 0) {
                                return null; // Remove action if no points remain
                            }
                            const firstPoint = filteredBrushPoints[0];
                            const lastPoint =
                                filteredBrushPoints[
                                    filteredBrushPoints.length - 1
                                ];
                            return {
                                ...action,
                                vector: new Vector(
                                    firstPoint.x,
                                    firstPoint.y,
                                    lastPoint.x - firstPoint.x,
                                    lastPoint.y - firstPoint.y,
                                ),
                            };
                        } else if (action.type === ACTION_TYPES.BUCKET_ACTIVE) {
                            const rejected_coords = new Set(
                                event.rejected_pixels.map(
                                    (p) => `${p.x},${p.y}`,
                                ),
                            );

                            const points = action.points.filter(
                                (point) =>
                                    !rejected_coords.has(
                                        `${point[0]},${point[1]}`,
                                    ),
                            );

                            return {
                                ...action,
                                points,
                            };
                        }
                        // For BRUSH_ACTIVE, ERASURE_ACTIVE, and BUCKET_ACTIVE
                        const rejected_coords = new Set(
                            event.rejected_pixels.map((p) => `${p.x},${p.y}`),
                        );

                        const points = action.points.filter(
                            (point) =>
                                !rejected_coords.has(`${point.x},${point.y}`),
                        );

                        return {
                            ...action,
                            points,
                        };
                    }
                    return action;
                })
                .filter((action) => action !== null) as Action[];

            return {
                ...context,
                actions: next_actions,
            };
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

            let pixels: Pixel[];
            if (actionToUndo.type === ACTION_TYPES.LINE_COMPLETE) {
                const linePoints = bresenhamLine(
                    actionToUndo.vector.x,
                    actionToUndo.vector.y,
                    actionToUndo.vector.x + actionToUndo.vector.magnitudeX,
                    actionToUndo.vector.y + actionToUndo.vector.magnitudeY,
                );
                const brushPoints = getBrushPoints(
                    linePoints,
                    actionToUndo.size,
                    1,
                );
                pixels = pointsToPixels(brushPoints, actionToUndo.color_ref);
            } else if (actionToUndo.type === ACTION_TYPES.BUCKET_ACTIVE) {
                pixels = absolutePointTupleToPixels(
                    actionToUndo.points,
                    actionToUndo.color_ref,
                );
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
                    getLastPixelValue(
                        context.canvas.chunkCanvases[
                            getChunkKey(pixel.x, pixel.y)
                        ].pixels,
                        pixel,
                    ) ??
                    ({
                        x: pixel.x,
                        y: pixel.y,
                        color_ref: 0,
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

            let pixels: Pixel[];
            if (actionToRedo.type === ACTION_TYPES.LINE_COMPLETE) {
                const linePoints = bresenhamLine(
                    actionToRedo.vector.x,
                    actionToRedo.vector.y,
                    actionToRedo.vector.x + actionToRedo.vector.magnitudeX,
                    actionToRedo.vector.y + actionToRedo.vector.magnitudeY,
                );
                const brushPoints = getBrushPoints(
                    linePoints,
                    actionToRedo.size,
                    1,
                );
                pixels = pointsToPixels(brushPoints, actionToRedo.color_ref);
            } else if (actionToRedo.type === ACTION_TYPES.BUCKET_ACTIVE) {
                pixels = absolutePointTupleToPixels(
                    actionToRedo.points,
                    actionToRedo.color_ref,
                );
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
                    getLastPixelValue(
                        context.canvas.chunkCanvases[
                            getChunkKey(pixel.x, pixel.y)
                        ].pixels,
                        pixel,
                    ) ??
                    ({
                        x: pixel.x,
                        y: pixel.y,
                        color_ref: 0,
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
                        pixelMap: new Map(),
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

            let newPixelMap = prev.pixelMap;
            if (pixels) {
                newPixelMap = new Map(prev.pixelMap);
                for (let i = 0; i < pixels.length; i++) {
                    const pixel = pixels[i];
                    const chunkPixel = {
                        x: pixel.x,
                        y: pixel.y,
                    };
                    const key = `${chunkPixel.x},${chunkPixel.y}`;
                    newPixelMap.set(key, pixel);
                }
            }

            context.canvas.chunkCanvases[chunkKey] = {
                ...prev,
                pixels: pixels ? [...prev.pixels, ...pixels] : prev.pixels,
                pixelMap: newPixelMap,
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

            const newPixelMap = new Map(prev.pixelMap);

            for (let i = 0; i < pixels.length; i++) {
                const pixel = pixels[i];
                const chunkPixel = {
                    x: pixel.x,
                    y: pixel.y,
                };
                const key = `${chunkPixel.x},${chunkPixel.y}`;
                newPixelMap.set(key, pixel);
            }

            context.canvas.chunkCanvases[chunkKey] = {
                ...prev,
                pixels: [...prev.pixels, ...pixels],
                pixelMap: newPixelMap,
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

            const newPixelMap = new Map(prev.pixelMap);
            for (const pixelId of pixelIds) {
                const [absX, absY] = pixelId.split(',').map(Number);
                const chunkPixelX = absX;
                const chunkPixelY = absY;
                const chunkKey = `${chunkPixelX},${chunkPixelY}`;
                newPixelMap.delete(chunkKey);
            }

            context.canvas.chunkCanvases[chunkKey] = {
                ...prev,
                pixels: remainingPixels,
                pixelMap: newPixelMap,
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

            // console.log({
            //     remainingPlots,
            //     prevPlots: prev.plots,
            //     chunkCanvases: context.canvas.chunkCanvases,
            //     plotIdSet,
            //     chunkKey,
            // });

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

            enqueue.effect(() => {
                store.trigger.resizeRealtimeAndTelegraphCanvases();

                // Show crosshair at center when camera moves
                showCrosshair();
                store.trigger.fetchPixels();

                if (options.autoSelectPlot) {
                    // Get the center point of the new camera position
                    const centerPoint = getCameraCenterPoint(newCamera);

                    // Find plot at center point
                    const plotAtCenter = findPlotAtPoint(centerPoint, {
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

            // Reset cursor when changing tools
            if (!isInitialStore(context)) {
                context.canvas.rootCanvas.style.cursor = '';
            }

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

        updateLineSettings: (
            context,
            { line }: { line: Partial<LineSettings> },
        ) => {
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

        togglePlotBorderVisibility: (context) => {
            if (isInitialStore(context)) return;
            if (!isAdminUser(context.user)) return context;

            return {
                ...context,
                adminSettings: {
                    ...context.adminSettings,
                    plotBordersVisible:
                        !context.adminSettings.plotBordersVisible,
                },
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
                throw new Error(
                    "Attempted to complete a claim when there isn't on active",
                );
            }

            const polygon = context.activeAction.polygon;

            if (polygon == null) {
                throw new Error('No polygon to complete claim');
            }

            context.queryClient.refetchQueries({ queryKey: ['user', 'plots'] });

            return {
                ...context,
                actions: context.actions.concat(
                    completeRectangleClaimerAction([polygon]),
                ),
                activeAction: null,
            };
        },

        moveToPlot: (context, { plotId }: { plotId: number }, enqueue) => {
            if (isInitialStore(context)) return;
            const userPlots = (context.queryClient.getQueryData([
                'user',
                'plots',
            ]) ?? []) as Plot[];

            const recentPlots = (context.queryClient.getQueryData([
                'plots',
                'list',
            ]) ?? []) as Plot[];

            const polygon =
                userPlots.find((plot) => plot.id === plotId)?.polygon ??
                recentPlots.find((plot) => plot.id === plotId)?.polygon;
            enqueue.effect(() => {
                if (polygon != null) {
                    store.trigger.moveCamera({
                        camera: centerCameraOnPoint(
                            getCenterPoint(polygon),
                            store.getSnapshot().context.camera,
                        ),
                        options: { deselectPlot: false, autoSelectPlot: false },
                    });
                } else {
                    console.log('userPlots', userPlots);
                    console.log('recentPlots', recentPlots);
                    console.log(
                        'No polygon found for plot, so not moving camera',
                        plotId,
                    );
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

            const userPlots = (context.queryClient.getQueryData([
                'user',
                'plots',
            ]) ?? []) as Plot[];

            const plot = userPlots.find((p) => p.id === plotId);

            if (!plot?.polygon) {
                console.error(
                    'Cannot edit plot: plot not found or has no polygon',
                );
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

            // Alt/Option key quick mode: temporarily switch to eyedropper
            if (context.interaction.isAltPressed || e.altKey) {
                return EyedropperTool.onPointerDown(e, context, enqueue);
            }

            const tool = context.toolSettings.currentTool;

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

            return context;
        },

        onPointerMove: (context, { e }: { e: PointerEvent }, enqueue) => {
            if (isInitialStore(context)) return;

            enqueue.effect(() => {
                store.trigger.setCursorPosition({ cursorPosition: e });
            });

            // Alt/Option key quick mode: show eyedropper cursor
            if (context.interaction.isAltPressed || e.altKey) {
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

            if (tool === Tool.Line) {
                return LineTool.onPointerOut(e, context, enqueue);
            }

            if (tool === Tool.Claimer) {
                return ClaimerTool.onPointerOut(e, context, enqueue);
            }

            return context;
        },

        onKeyDown: (context, { e }: { e: KeyboardEvent }, enqueue) => {
            if (isInitialStore(context)) return;
            if (e.defaultPrevented) return;

            if (isAdminUser(context.user) && isHotkey('mod+shift+b', e)) {
                e.preventDefault();
                enqueue.effect(() =>
                    store.trigger.togglePlotBorderVisibility(),
                );
                return context;
            }

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

            // Camera zoom shortcuts (Cmd/Ctrl + Plus/Minus)
            // Platform-specific: Mac uses metaKey (Cmd), Windows uses ctrlKey
            const isMac =
                /Mac|iPhone|iPod|iPad/i.test(navigator.platform) ||
                /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent);
            const isModKeyPressed = isMac
                ? e.metaKey && !e.ctrlKey
                : e.ctrlKey && !e.metaKey;
            // Use e.code for more reliable key detection (Equal for =/+ key, Minus for -/_ key)
            const isZoomIn =
                isModKeyPressed &&
                (e.code === 'Equal' || e.key === '=' || e.key === '+');
            const isZoomOut =
                isModKeyPressed &&
                (e.code === 'Minus' || e.key === '-' || e.key === '_');

            if (isZoomIn || isZoomOut) {
                e.preventDefault();

                const pixelWidth = context.camera.zoom / 20;
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;

                // Non-linear zoom stops
                const zoomStops = [
                    50, 60, 75, 100, 150, 200, 300, 400, 600, 800,
                ];
                const currentZoom = context.camera.zoom;

                let nextZoom: number;
                if (isZoomIn) {
                    // Find the next zoom stop greater than current zoom
                    const nextStop = zoomStops.find(
                        (stop) => stop > currentZoom,
                    );
                    nextZoom = nextStop
                        ? clamp(nextStop, ZOOM_MIN, ZOOM_MAX)
                        : clamp(currentZoom, ZOOM_MIN, ZOOM_MAX);
                } else {
                    // Find the previous zoom stop less than current zoom
                    const previousStop = zoomStops
                        .slice()
                        .reverse()
                        .find((stop) => stop < currentZoom);
                    nextZoom = previousStop
                        ? clamp(previousStop, ZOOM_MIN, ZOOM_MAX)
                        : clamp(currentZoom, ZOOM_MIN, ZOOM_MAX);
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
                            x: roundTo1Place(
                                clamp(
                                    context.camera.x + deltaXFromZoom,
                                    X_MIN,
                                    X_MAX,
                                ),
                            ),
                            y: roundTo1Place(
                                clamp(
                                    context.camera.y + deltaYFromZoom,
                                    Y_MIN,
                                    Y_MAX,
                                ),
                            ),
                        },
                    });
                });

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

                if (isHotkey('l', e)) {
                    e.preventDefault();
                    enqueue.effect(() =>
                        store.trigger.changeTool({ tool: Tool.Line }),
                    );
                    return context;
                }

                if (isHotkey('g', e)) {
                    e.preventDefault();
                    enqueue.effect(() =>
                        store.trigger.changeTool({ tool: Tool.Bucket }),
                    );
                    return context;
                }

                // Palette navigation shortcuts (now for foreground color)
                if (isHotkey('[', e)) {
                    e.preventDefault();
                    enqueue.effect(() =>
                        store.trigger.updatePaletteSettings({
                            palette: {
                                foregroundColorRef: getPreviousColor(
                                    context.toolSettings.palette
                                        .foregroundColorRef,
                                ),
                            },
                        }),
                    );
                    return context;
                }

                if (isHotkey(']', e)) {
                    e.preventDefault();
                    enqueue.effect(() =>
                        store.trigger.updatePaletteSettings({
                            palette: {
                                foregroundColorRef: getNextColor(
                                    context.toolSettings.palette
                                        .foregroundColorRef,
                                ),
                            },
                        }),
                    );
                    return context;
                }

                // Swap foreground and background colors
                if (isHotkey('x', e)) {
                    e.preventDefault();
                    const foregroundColorRef =
                        context.toolSettings.palette.foregroundColorRef;
                    const backgroundColorRef =
                        context.toolSettings.palette.backgroundColorRef;
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
                if (isHotkey('9', e)) {
                    e.preventDefault();
                    enqueue.effect(() =>
                        store.trigger.updatePaletteSettings({
                            palette: {
                                foregroundColorRef: getPreviousColor(
                                    context.toolSettings.palette
                                        .foregroundColorRef,
                                ),
                            },
                        }),
                    );
                    return context;
                }

                if (isHotkey('0', e)) {
                    e.preventDefault();
                    enqueue.effect(() =>
                        store.trigger.updatePaletteSettings({
                            palette: {
                                foregroundColorRef: getNextColor(
                                    context.toolSettings.palette
                                        .foregroundColorRef,
                                ),
                            },
                        }),
                    );
                    return context;
                }
            }

            // Tool size shortcuts (plus/minus)
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

                if (context.toolSettings.currentTool === Tool.Line) {
                    const currentSize = context.toolSettings.line.size;
                    enqueue.effect(() =>
                        store.trigger.updateLineSettings({
                            line: { size: clampLineSize(currentSize + 1) },
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

                if (context.toolSettings.currentTool === Tool.Line) {
                    const currentSize = context.toolSettings.line.size;
                    enqueue.effect(() =>
                        store.trigger.updateLineSettings({
                            line: { size: clampLineSize(currentSize - 1) },
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

            // Alt/Option key: toggle eyedropper mode
            // Only trigger when Alt is pressed by itself (not as a modifier for another key)
            if (e.code === 'AltLeft' || e.code === 'AltRight') {
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

            if (e.code === KeyboardCode.Space) {
                return {
                    ...context,
                    interaction: {
                        ...context.interaction,
                        isSpacePressed: false,
                    },
                };
            }

            // Alt/Option key: restore previous tool and cursor
            if (e.code === 'AltLeft' || e.code === 'AltRight') {
                if (
                    context.interaction.isAltPressed &&
                    context.interaction.previousTool !== null
                ) {
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
                    e.deltaY < 0
                        ? getPreviousColor(currentColorRef)
                        : getNextColor(currentColorRef);

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
