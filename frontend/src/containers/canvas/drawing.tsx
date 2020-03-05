import React, { useEffect, useRef} from 'react';

import { Line } from '../../.old/canvas.todo';
import { CanvasSettings } from '../../models/canvas';
import { useWindowSize } from 'react-use';
import styled from 'styled-components';
import { drawPoints } from '../../helpers/canvas.helpers';

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

    const clear = () => {
        if (drawingCanvas.current && drawingCanvas.current.getContext('2d')) {
            const c = drawingCanvas.current.getContext('2d') as any;
            c.clearRect(0, 0, width, height);
        }
    };

    const simulateDrawingLines = (lines: Line[]) => {
        clear();
        lines.forEach(line => {
            const { points, brushColor, brushWidth } = line;
            console.log(line);

            drawPoints(drawingCanvas, points, brushColor, brushWidth);
        });
    };

    useEffect(() => {
        simulateDrawingLines(props.lines);
    }, [props.lines]);

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
