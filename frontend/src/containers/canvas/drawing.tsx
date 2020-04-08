import React, { useEffect, useRef } from 'react';

import { CanvasSettings, Line } from '../../models';
import { useWindowSize } from 'react-use';
import styled from 'styled-components';
import { clear, clear2, drawPoints, drawPoints2 } from '../../helpers/canvas.helpers';
import { useMapPosition } from '../../context/mapPosition.context';

const DrawingCanvas = styled.canvas`
    display: block;
    position: absolute;
    z-index: 11;
`;
const TempCanvas = styled.canvas`
    display: none;
`;

interface DrawingProps {
    lines: Line[];
    canvasSettings: CanvasSettings;
}

const Drawing: React.FC<DrawingProps> = ({ canvasSettings, ...props }) => {
    const drawingCanvas = useRef<HTMLCanvasElement>(null);
    const canvasRenderingContext2D = useRef<CanvasRenderingContext2D | null>(null);
    const { width, height } = useWindowSize();
    const [_, mapPosition] = useMapPosition();

    useEffect(() => {
        if (drawingCanvas.current) {
            canvasRenderingContext2D.current = drawingCanvas.current.getContext('2d');
        }
    }, [drawingCanvas.current]);

    const simulateDrawingLines = (lines: Line[]) => {
        if (canvasRenderingContext2D.current) {
            lines.forEach(line => {
                const { points, brushColor, brushWidth } = line;
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                drawPoints2(canvasRenderingContext2D.current, points, mapPosition, brushColor, brushWidth);
            });
        }
    };

    useEffect(() => {
        console.log('redraw due to different lines or map position');
        if (drawingCanvas.current && canvasRenderingContext2D.current) {
            clear2(canvasRenderingContext2D.current, drawingCanvas.current.width, drawingCanvas.current.height);
        }
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

    return (
        <>
            <TempCanvas ref={drawingCanvas} />
            <DrawingCanvas ref={drawingCanvas} />
        </>
    );
};

export default Drawing;
