import React, { useEffect, useRef, useState } from 'react';
import { LazyBrush } from 'lazy-brush';

import { Point, Line } from '../../.old/canvas.todo';
import { CanvasSettings } from '../../models/canvas';
import { useWindowSize } from 'react-use';
import styled from 'styled-components';
import { drawBrush, drawPoints } from '../../helpers/canvas.helpers';

const BrushCanvas = styled.canvas`
    display: block;
    position: absolute;
    z-index: 15;
`;

const TempCanvas = styled.canvas`
    display: block;
    position: absolute;
    z-index: 12;
`;

interface BrushProps {
    onNewLine: (line: Line) => void;
    style?: any;
    className?: any;
    canvasSettings: CanvasSettings;
}

const Brush: React.FC<BrushProps> = ({  canvasSettings, ...props }) => {
    const brushCanvas = useRef<HTMLCanvasElement>(null);
    const tempCanvas = useRef<HTMLCanvasElement>(null);
    const { width, height } = useWindowSize();

    const lazy = useRef(
        new LazyBrush({
            radius: window.devicePixelRatio,
            enabled: true,
            initialPoint: {
                x: width / 2,
                y: height / 2,
            },
        })
    );
    const mouseHasMoved = useRef(false);
    const isPressing = useRef(false);
    const isDrawing = useRef(false);
    const [points, setPoints] = useState<Point[]>([]);

    useEffect(() => {
        let animationFrame: number;
        function loop() {
            animationFrame = requestAnimationFrame(onFrame);
        }
        function onFrame() {
            const pointer = lazy.current.getPointerCoordinates();
            drawBrush(brushCanvas, pointer, canvasSettings);
            mouseHasMoved.current = false;
            loop();
        }
        loop();
        return () => {
            cancelAnimationFrame(animationFrame);
        };
    }, [canvasSettings]);

    useEffect(() => {
        window.setTimeout(() => {
            const x = window.innerWidth / 2;
            const y = window.innerHeight / 2;
            lazy.current.update({ x, y }, { both: true });
            lazy.current.update({ x, y }, { both: false });

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

        if (tempCanvas.current) {
            tempCanvas.current.width = width;
            tempCanvas.current.height = height;
            tempCanvas.current.style.width = width;
            tempCanvas.current.style.height = height;
        }
    }, [width, height]);

    const saveLine = () => {
        if (points.length < 2) return;

        props.onNewLine({
            points,
            brushColor: canvasSettings.brushColor,
            brushWidth: canvasSettings.brushWidth,
        });
        setPoints([]);
    };

    const getPointerPos = (e: React.MouseEvent): Point => {
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
        lazy.current.update({ x, y });

        const newLine = [...points, lazy.current.brush.toObject()];

        if (isPressing.current) {
            setPoints(newLine);
            isDrawing.current = true;
        }

        if (isDrawing.current && lazy.current.brushHasMoved() && points.length > 0) {
            drawPoints(
                tempCanvas,
                [points[points.length - 1], lazy.current.brush.toObject()],
                canvasSettings.brushColor,
                canvasSettings.brushWidth
            );
        }

        mouseHasMoved.current = true;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const { x, y } = getPointerPos(e);
        handlePointerMove(x, y);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isPressing.current = true;
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        e.preventDefault();
        isDrawing.current = false;
        isPressing.current = false;

        saveLine();
    };

    return (
        <>
            <BrushCanvas
                data-test="brush canvas"
                ref={brushCanvas}
                onMouseDown={handleMouseDown}
                onMouseOut={handleMouseUp}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            />
            <TempCanvas
                data-test="temp canvas"
                ref={tempCanvas}
                onMouseDown={handleMouseDown}
                onMouseOut={handleMouseUp}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            />
        </>
    );
};
export default Brush;
