'use client';

import { useEffect, useRef } from 'react';

import { Footer } from '@/components/footer';
import { Navigation } from '@/components/navigation';
import { Palette } from '@/components/palette';
import { Toolbar } from '@/components/toolbar';
import { WebGPUWarning } from '@/components/webgpu-warning';
import {
    createBackgroundCanvas,
    drawBackgroundCanvas,
} from '@/lib/canvas/background';
import { createFullsizeCanvas } from '@/lib/canvas/fullsize';
import { createRealtimeCanvas } from '@/lib/canvas/realtime';
import { store } from '@/lib/store';
import { DEFAULT_TOOL_SETTINGS, getToolSettings } from '@/lib/tool-settings';
import { BrushPanel } from '@/lib/tools/brush/brush-panel';
import { ClaimerPanel } from '@/lib/tools/claimer/claimer-panel';
import { ErasurePanel } from '@/lib/tools/erasure/erasure-panel';
import { cn } from '@/lib/utils';
import { keyEquals } from '@/lib/utils/query-key';
import {
    stringToNumberOr0,
    stringToNumberOr100,
} from '@/lib/utils/stringToNumberOrDefault';
import { createWebGPUManager } from '@/lib/webgpu/web-gpu-manager';
import { useQueryClient } from '@tanstack/react-query';
import { useSelector } from '@xstate/store/react';

export default function Page() {
    const queryClient = useQueryClient();

    const state = useSelector(store, (state) => state.context.state);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (state === 'webgpu-failed') {
            console.error(
                'Stopped trying to initialize since webGPU is not supported.',
            );
            return;
        }

        const element = canvasRef.current;
        console.log('element', element);
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
                            console.log('hydrating store');

                            store.trigger.hydrateStore({
                                body,
                                canvas: element,
                                // todo(josh): make a config module that checks env vars
                                apiOrigin:
                                    process.env.NEXT_PUBLIC_API_ORIGIN ??
                                    'https://api.42colors.com',
                                apiWebsocketOrigin:
                                    process.env
                                        .NEXT_PUBLIC_API_WEBSOCKET_ORIGIN ??
                                    'https://api.42colors.com',
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
                            store.trigger.transitionToWebGPUFailed();
                        }
                    },
                )
                .catch((error) => {
                    console.error(error);
                    store.trigger.transitionToWebGPUFailed();
                });

            const unsubscribe = queryClient
                .getQueryCache()
                .subscribe((event) => {
                    const key = ['user', 'plots'];
                    if (keyEquals(event.query.queryKey, key)) {
                        store.trigger.resizeRealtimeAndTelegraphCanvases();
                        store.trigger.redrawUICanvas();
                    }
                });

            const rafId = requestAnimationFrame(draw);
            store.trigger.listen({ element, body });

            return () => {
                cancelAnimationFrame(rafId);
                store.trigger.unlisten({ element, body });
                unsubscribe();
            };

            function draw() {
                store.trigger.draw();
                requestAnimationFrame(draw);
            }
        }
    }, [queryClient, state]);

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

            <div className="flex flex-col items-start space-y-3 fixed top-16 bottom-12 left-3">
                {state === 'initialized' && (
                    <>
                        {currentTool === 'brush' && <Palette />}
                        {currentTool === 'brush' && <BrushPanel />}
                        {currentTool === 'erasure' && <ErasurePanel />}
                    </>
                )}
            </div>

            <div className="flex flex-row space-x-3 fixed top-3 left-60">
                {currentTool === 'claimer' && <ClaimerPanel />}
            </div>

            <div className="flex fixed top-3 right-3">
                <Toolbar />
            </div>

            <Footer />

            <div className="flex fixed bottom-3 right-3">
                <Navigation />
            </div>

            <WebGPUWarning />
        </>
    );
}
