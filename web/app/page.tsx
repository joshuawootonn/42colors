'use client';

import { useEffect, useRef, useState } from 'react';

import { Footer } from '@/components/footer';
import { Navigation } from '@/components/navigation';
import { Palette } from '@/components/palette';
import { Toolbar } from '@/components/toolbar';
import { WebGPUWarning } from '@/components/webgpu-warning';
import authService from '@/lib/auth';
import {
    createBackgroundCanvas,
    drawBackgroundCanvas,
} from '@/lib/canvas/background';
import { createFullsizeCanvas } from '@/lib/canvas/fullsize';
import { createRealtimeCanvas } from '@/lib/canvas/realtime';
import { store } from '@/lib/store';
import {
    DEFAULT_TOOL_SETTINGS,
    Tool,
    getToolSettings,
} from '@/lib/tool-settings';
import { BrushPanel } from '@/lib/tools/brush/brush-panel';
import { NewPlotPopover } from '@/lib/tools/claimer/new-plot-popover';
import { SelectedPlotPopover } from '@/lib/tools/claimer/selected-plot-popover';
import { ErasurePanel } from '@/lib/tools/erasure/erasure-panel';
import { LinePanel } from '@/lib/tools/line/line-panel';
import { cn } from '@/lib/utils';
import { keyEquals } from '@/lib/utils/query-key';
import {
    stringToNumberOr0,
    stringToNumberOr100,
} from '@/lib/utils/stringToNumberOrDefault';
import { createWebGPUManager } from '@/lib/webgpu/web-gpu-manager';
import { QueryObserver, useQueryClient } from '@tanstack/react-query';
import { useSelector } from '@xstate/store/react';

export default function Page() {
    const queryClient = useQueryClient();

    const [isWebGPUAvailable, setIsWebGPUAvailable] = useState(true);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!isWebGPUAvailable) {
            console.warn(
                'Stopped trying to initialize because WebGPU is not available',
            );
        }

        const element = canvasRef.current;
        if (element instanceof HTMLCanvasElement) {
            const context = element.getContext('2d');
            if (context == null) {
                throw new Error('Failed to initialize the Canvas');
            }

            const search = new URLSearchParams(document.location.search);
            const x = stringToNumberOr0.parse(search.get('x'));
            const y = stringToNumberOr0.parse(search.get('y'));
            const zoom = stringToNumberOr100.parse(search.get('zoom'));

            const body = document.body as HTMLBodyElement;

            const toolSettings = getToolSettings();

            const rootCanvasContext = element.getContext('2d')!;
            rootCanvasContext.imageSmoothingEnabled = false;

            const backgroundCanvas = createBackgroundCanvas();
            const backgroundCanvasContext = backgroundCanvas.getContext('2d')!;
            backgroundCanvasContext.imageSmoothingEnabled = false;
            drawBackgroundCanvas(backgroundCanvas, backgroundCanvasContext);

            const realtimeCanvas = createRealtimeCanvas({ x, y, zoom });
            const telegraphCanvas = createFullsizeCanvas();
            const uiCanvas = createFullsizeCanvas();

            const apiOrigin =
                process.env.NEXT_PUBLIC_API_ORIGIN ??
                'https://api.42colors.com';
            const apiWebsocketOrigin =
                process.env.NEXT_PUBLIC_API_WEBSOCKET_ORIGIN ??
                'https://api.42colors.com';

            Promise.all([
                createWebGPUManager(uiCanvas),
                createWebGPUManager(telegraphCanvas),
                createWebGPUManager(realtimeCanvas),
            ])
                .then(
                    ([
                        uiWebGPUManager,
                        telegraphWebGPUManager,
                        realtimeWebGPUManager,
                    ]) => {
                        if (
                            uiWebGPUManager &&
                            telegraphWebGPUManager &&
                            realtimeWebGPUManager
                        ) {
                            console.log('initializing store');

                            store.trigger.initializeStore({
                                body,
                                canvas: element,
                                // todo(josh): make a config module that checks env vars
                                apiOrigin,
                                apiWebsocketOrigin,
                                cameraOptions: { x, y, zoom },
                                queryClient,
                                toolSettings:
                                    toolSettings ?? DEFAULT_TOOL_SETTINGS,
                                rootCanvasContext,
                                backgroundCanvas,
                                backgroundCanvasContext,
                                realtimeCanvas,
                                telegraphCanvas,
                                uiCanvas,
                                uiWebGPUManager,
                                telegraphWebGPUManager,
                                realtimeWebGPUManager,
                            });
                        } else {
                            console.error(
                                'Failed to initialize WebGPU managers',
                            );
                        }
                    },
                )
                .catch((error) => {
                    console.error('WebGPU initialization failed:', error);
                    setIsWebGPUAvailable(false);
                });
            const unsubscribePlotCacheChanges = queryClient
                .getQueryCache()
                .subscribe((event) => {
                    const key = ['user', 'plots'];
                    if (keyEquals(event.query.queryKey, key)) {
                        // Defer store updates to avoid render-time state updates
                        setTimeout(() => {
                            store.trigger.resizeRealtimeAndTelegraphCanvases();
                        });
                    }
                });

            const observer = new QueryObserver(queryClient, {
                queryKey: ['user', 'me'],
                queryFn: () => authService.getCurrentUser(apiOrigin),
            });
            const unsubscribeUserSubscription = observer.subscribe((result) => {
                if (result.data != null) {
                    store.trigger.setUser({
                        user: result.data ? result.data.user : null,
                    });
                    store.trigger.reconnectToSocket({
                        channel_token: result.data?.user.channel_token,
                    });
                }
            });

            const rafId = requestAnimationFrame(draw);
            store.trigger.listen({ element, body });

            return () => {
                cancelAnimationFrame(rafId);
                store.trigger.unlisten({ element, body });
                unsubscribePlotCacheChanges();
                unsubscribeUserSubscription();
            };

            function draw() {
                store.trigger.draw();
                requestAnimationFrame(draw);
            }
        }
    }, [queryClient, isWebGPUAvailable]);

    const isPressed = useSelector(
        store,
        (state) => state.context.interaction?.isPressed,
    );

    const isSpacePressed = useSelector(
        store,
        (state) => state.context.interaction?.isSpacePressed,
    );

    const currentTool = useSelector(
        store,
        (state) => state.context.toolSettings.currentTool,
    );

    return (
        <>
            <canvas
                ref={canvasRef}
                className={cn(
                    'touch-none',
                    isSpacePressed
                        ? isPressed
                            ? 'cursor-grabbing'
                            : 'cursor-grab'
                        : null,
                )}
                height="100vh"
                width="100vw"
            ></canvas>

            <div className="fixed bottom-12 left-3 top-16 flex flex-col items-start space-y-3">
                {isWebGPUAvailable && (
                    <>
                        {(currentTool === Tool.Brush ||
                            currentTool === Tool.Line) && <Palette />}
                        {currentTool === Tool.Brush && <BrushPanel />}
                        {currentTool === Tool.Erasure && <ErasurePanel />}
                        {currentTool === Tool.Line && <LinePanel />}
                    </>
                )}
            </div>

            <NewPlotPopover />
            <SelectedPlotPopover />

            <div className="fixed right-3 top-3 flex">
                <Toolbar />
            </div>

            <Footer />

            <div className="fixed bottom-3 right-3 flex">
                <Navigation />
            </div>

            {!isWebGPUAvailable && <WebGPUWarning />}
        </>
    );
}
