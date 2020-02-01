import React, { useEffect, useRef, useState } from 'react';
import { LazyBrush } from 'lazy-brush';
import { Catenary } from 'catenary-curve';

import { Point } from './canvas.todo';
import { CanvasSettings } from '../models/canvas';
import { useWindowSize } from 'react-use';
import styled from 'styled-components';

const BrushCanvas = styled.canvas`
    display: block;
    position: absolute;
    z-index: 15;
`;

interface BrushProps {
    canvasWidth: number | string;
    canvasHeight: number | string;
    style?: any;
    className?: any;
    canvasSettings: CanvasSettings;
}

const Brush: React.FC<BrushProps> = ({ canvasWidth = 400, canvasHeight = 400, canvasSettings, ...props }) => {
    const brushCanvas = useRef<HTMLCanvasElement>(null);
    const { width, height } = useWindowSize();

    const [lazy, setLazy] = useState(
        new LazyBrush({
            radius: canvasSettings.lazyRadius * window.devicePixelRatio,
            enabled: true,
            initialPoint: {
                x: width / 2,
                y: height / 2,
            },
        })
    );
    const [catenary, setCatenary] = useState(new Catenary());
    const mouseHasMoved = useRef(false);
    const [chainLength, setChainLength] = useState(0);

    const drawInterface = (pointer: Point, brush: Point, canvasSettings: CanvasSettings) => {
        if (brushCanvas.current && brushCanvas.current.getContext('2d')) {
            const c = brushCanvas.current.getContext('2d') as any;
            c.clearRect(0, 0, c.canvas.width, c.canvas.height);

            // Draw brush preview
            c.beginPath();
            c.fillStyle = canvasSettings.brushColor;
            c.arc(brush.x, brush.y, canvasSettings.brushRadius, 0, Math.PI * 2, true);
            c.fill();

            // Draw mouse point (the one directly at the cursor)
            c.beginPath();
            c.fillStyle = canvasSettings.catenaryColor;
            c.arc(pointer.x, pointer.y, 4, 0, Math.PI * 2, true);
            c.fill();

            c.beginPath();
            c.lineWidth = 2;
            c.lineCap = 'round';
            c.setLineDash([2, 4]);
            c.strokeStyle = canvasSettings.catenaryColor;
            catenary.drawToCanvas(c, brush, pointer, canvasSettings.lazyRadius);
            c.stroke();

            // Draw brush point (the one in the middle of the brush preview)
            c.beginPath();
            c.fillStyle = canvasSettings.catenaryColor;
            c.arc(brush.x, brush.y, 2, 0, Math.PI * 2, true);
            c.fill();
        }
    };

    useEffect(() => {
        let animationFrame: number;
        function loop() {
            animationFrame = requestAnimationFrame(onFrame);
        }
        function onFrame() {
            if (mouseHasMoved && mouseHasMoved.current) {
                const pointer = lazy.getPointerCoordinates();
                const brush = lazy.getBrushCoordinates();

                drawInterface(pointer, brush, canvasSettings);
                mouseHasMoved.current = false;
            }
            loop();
        }
        loop();

        lazy.setRadius(canvasSettings.lazyRadius * window.devicePixelRatio);

        return () => {
            cancelAnimationFrame(animationFrame);
        };
    }, [canvasSettings]);

    useEffect(() => {
        setChainLength(canvasSettings.lazyRadius * window.devicePixelRatio);

        window.setTimeout(() => {
            const initX = window.innerWidth / 2;
            const initY = window.innerHeight / 2;
            lazy.update({ x: initX - chainLength / 4, y: initY }, { both: true });
            lazy.update({ x: initX + chainLength / 4, y: initY }, { both: false });

            mouseHasMoved.current = true;
            // this.valuesChanged = true;
            // this.clear();
        }, 100);
    }, []);

    useEffect(() => {
        if (brushCanvas.current) {
            brushCanvas.current.width = width;
            brushCanvas.current.height = height;
            brushCanvas.current.style.width = width;
            brushCanvas.current.style.height = height;
        }
    }, [width, height]);

    const getPointerPos = (e: any): Point => {
        if (brushCanvas.current) {
            const rect = brushCanvas.current.getBoundingClientRect();

            // use cursor pos as default
            const clientX = e.clientX;
            const clientY = e.clientY;

            // return mouse/touch position inside canvas
            return {
                x: clientX - rect.left,
                y: clientY - rect.top,
            };
        } else {
            return { x: 0, y: 0 };
        }
    };

    const handlePointerMove = (x: number, y: number) => {
        lazy.update({ x, y });
        mouseHasMoved.current = true;
    };

    const handleMouseMove = (e: any) => {
        const { x, y } = getPointerPos(e);
        handlePointerMove(x, y);
    };

    return <BrushCanvas ref={brushCanvas} onMouseMove={handleMouseMove} />;
};
export default Brush;
