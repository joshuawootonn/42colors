import React, { useEffect, useRef, useState } from 'react';
import { LazyBrush } from 'lazy-brush';
import { Catenary } from 'catenary-curve';

import { Point, Line } from './canvas.todo';
import { CanvasSettings } from '../models/canvas';
import { useWindowSize } from 'react-use';
import styled from 'styled-components';
import { drawPoints } from './canvasHelpers';

const DrawingCanvas = styled.canvas`
    display: block;
    position: absolute;
    z-index: 11;
`;

interface BrushProps {
    lines: Line[];
    canvasWidth: number | string;
    canvasHeight: number | string;
    style?: any;
    className?: any;
    canvasSettings: CanvasSettings;
}

const Drawing: React.FC<BrushProps> = ({ canvasWidth = 400, canvasHeight = 400, canvasSettings, ...props }) => {
    const drawingCanvas = useRef<HTMLCanvasElement>(null);
    const { width, height } = useWindowSize();

    const simulateDrawingLines = (lines: Line[]) => {
        lines.forEach(line => {
            const { points, brushColor, brushRadius } = line;
            console.log(line)
            drawPoints(drawingCanvas, points, brushColor, brushRadius);
        });
    };

    const clear = () => {
        if (drawingCanvas.current && drawingCanvas.current.getContext('2d')) {
            const c = drawingCanvas.current.getContext('2d') as any;
            c.clearRect(0, 0, width, height);
        }
    };
    useEffect(() => {
        // clear();
        simulateDrawingLines(props.lines);
    }, [props.lines]);

    useEffect(() => {
        if (drawingCanvas.current) {
            drawingCanvas.current.width = width;
            drawingCanvas.current.height = height;
            drawingCanvas.current.style.width = width;
            drawingCanvas.current.style.height = height;
        }
    }, [width, height]);

    return <DrawingCanvas ref={drawingCanvas} />;
};
export default Drawing;
