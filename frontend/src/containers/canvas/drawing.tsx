import React, { useEffect, useRef } from 'react';

import { Line } from '../../.old/canvas.todo';
import { CanvasSettings } from '../../models/canvas';
import { useWindowSize } from 'react-use';
import styled from 'styled-components';
import { clear, drawPoints } from '../../helpers/canvas.helpers';
import { useMapPosition } from '../../context/mapPosition.context';

const DrawingCanvas = styled.canvas`
    display: block;
    position: absolute;
    z-index: 11;
`;

interface BrushProps {
    lines: Line[];
    style?: any;
    className?: any;
    canvasSettings: CanvasSettings;
}

const Drawing: React.FC<BrushProps> = ({ canvasSettings, ...props }) => {
    const drawingCanvas = useRef<HTMLCanvasElement>(null);
    const { width, height } = useWindowSize();
    const [_, mapPosition] = useMapPosition();

    const simulateDrawingLines = (lines: Line[]) => {
        lines.forEach(line => {
            const { points, brushColor, brushWidth } = line;
            drawPoints(drawingCanvas, points, mapPosition, brushColor, brushWidth);
        });
    };

    useEffect(() => {
        clear(drawingCanvas);
        simulateDrawingLines(props.lines);
    }, [props.lines, mapPosition]);

    useEffect(() => {
        if (drawingCanvas.current) {
            drawingCanvas.current.width = width;
            drawingCanvas.current.height = height;
            drawingCanvas.current.style.width = width;
            drawingCanvas.current.style.height = height;
        }
        simulateDrawingLines(props.lines);
    }, [width, height]);

    return <DrawingCanvas ref={drawingCanvas} />;
};
export default Drawing;
