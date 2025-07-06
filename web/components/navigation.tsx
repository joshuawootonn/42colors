import { z } from 'zod';

import { ChangeEvent, useCallback } from 'react';

import { X_MAX, X_MIN, Y_MAX, Y_MIN } from '@/lib/constants';
import { roundTo1Place } from '@/lib/round-to-five';
import { store } from '@/lib/store';
import { cn } from '@/lib/utils';
import { clamp } from '@/lib/utils/clamp';
import { useSelector } from '@xstate/store/react';

import { NumberInput } from './ui/number-input';
import { useCameraSearchParams } from './use-camera-search-params';

const numberSchema = z.number();

const camera = store.select((store) => store.camera);

export function Navigation() {
    const { x, y, zoom } = useSelector(store, (state) => state.context.camera);

    const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const { x, y, zoom } = camera.get();
        const parsedNumber = numberSchema.safeParse(
            parseInt(e.currentTarget.value),
        );
        const next = parsedNumber.success ? parsedNumber.data : 0;

        if (e.currentTarget.name === 'x') {
            store.trigger.moveCamera({
                camera: { x: roundTo1Place(clamp(next, X_MIN, X_MAX)) },
            });
        } else if (e.currentTarget.name === 'y') {
            store.trigger.moveCamera({
                camera: { y: roundTo1Place(clamp(next, Y_MIN, Y_MAX)) },
            });
        } else if (e.currentTarget.name === 'zoom') {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;

            const pixelWidth = zoom / 20;
            const pixelX = centerX / pixelWidth;
            const pixelY = centerY / pixelWidth;

            const nextPixelWidth = next / 20;

            const nextPixelX = centerX / nextPixelWidth;
            const nextPixelY = centerY / nextPixelWidth;

            const deltaXFromZoom = pixelX - nextPixelX;
            const deltaYFromZoom = pixelY - nextPixelY;

            store.trigger.moveCamera({
                camera: {
                    zoom: roundTo1Place(next),
                    x: roundTo1Place(clamp(x + deltaXFromZoom, X_MIN, X_MAX)),
                    y: roundTo1Place(clamp(y + deltaYFromZoom, Y_MIN, Y_MAX)),
                },
            });
        }

        store.trigger.fetchPixels();
    }, []);

    useCameraSearchParams(x, y, zoom);

    const state = useSelector(store, (state) => state.context.state);
    if (state !== 'initialized') return null;

    return (
        <div
            className={cn(
                'flex space-x-1.5 justify-center items-center select-none text-xl',
            )}
        >
            <button
                onClick={() => {
                    store.trigger.moveCamera({
                        camera: { x: 0, y: 0, zoom: 100 },
                    });
                    store.trigger.fetchPixels();
                }}
                className={
                    'relative z-0 svg-outline-within-sm outline-none flex justify-center items-center h-8 bg-transparent text-base'
                }
            >
                <svg
                    width="30"
                    height="30"
                    viewBox="0 0 30 30"
                    className="fill-secondary"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M26.1429 2L3.85715 9.42857V23.5429L26.1429 17.6V2Z"
                        className="stroke-primary"
                        strokeWidth="1.5"
                    />
                    <path
                        d="M6.08575 22.8V28H12.0286C12.0286 27.4058 12.0286 25.7715 12.0286 25.0286H16.4858V28H24.6572V18.3429"
                        className="stroke-primary"
                        strokeWidth="1.5"
                    />
                    <path
                        d="M19.4642 22.8071H21.6785V25.0214H19.4642V22.8071Z"
                        className="stroke-primary"
                        strokeWidth="1.5"
                    />
                    <rect
                        x="15.3714"
                        y="8.06854"
                        width="3.50898"
                        height="1.30551"
                        className="fill-primary"
                    />
                    <rect
                        x="9.42819"
                        y="16.2648"
                        width="3.50898"
                        height="1.30551"
                        className="fill-primary"
                    />
                    <rect
                        x="5.91922"
                        y="17.6901"
                        width="3.50898"
                        height="1.30551"
                        className="fill-primary"
                    />
                    <rect
                        x="11.8625"
                        y="9.37408"
                        width="3.50898"
                        height="1.30551"
                        className="fill-primary"
                    />
                </svg>
            </button>
            <NumberInput
                name="x"
                value={x}
                min={-50500}
                max={50500}
                step={5}
                onChange={onChange}
            />
            <NumberInput
                name="y"
                value={y}
                step={5}
                min={-50500}
                max={50500}
                onChange={onChange}
            />
            <NumberInput
                name="zoom"
                value={zoom}
                step={10}
                min={50}
                max={1000}
                onChange={onChange}
            />
        </div>
    );
}
