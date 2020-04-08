import React, { useEffect, useRef } from 'react';

import { useWindowSize } from 'react-use';
import styled from 'styled-components';
import { clear2, copyFromCanvasToContext, drawLines, drawPoints2, resizeCanvas } from '../../helpers/canvas.helpers';
import { useMapPosition } from '../../context/mapPosition.context';

const DrawingCanvas = styled.canvas`
    display: block;
    position: absolute;
    z-index: 11;
`;
const TempCanvas = styled.canvas`
    display: none;
`;

const Drawing = ({ canvasSettings, ...props }) => {
    const drawingCanvas = useRef(null);
    const drawingContext = useRef(null);
    const tempCanvas = useRef(null);
    const tempContext = useRef(null);

    const { width, height } = useWindowSize();
    const [isPanning, mapPosition] = useMapPosition();
    const panOffset = useRef({ x: 0, y: 0 });

    const redraw = () => {
        if (drawingCanvas.current && drawingContext.current) {
            clear2(drawingContext.current, drawingCanvas.current.width, drawingCanvas.current.height);
            drawLines(drawingContext.current, props.lines, mapPosition);
        }
    };

    const reContext = () => {
        if (drawingCanvas.current && tempCanvas.current) {
            drawingContext.current = drawingCanvas.current.getContext('2d');
            tempContext.current = tempCanvas.current.getContext('2d');
        }
    };

    useEffect(() => {
        reContext();
    }, []);

    useEffect(() => {
        redraw();
    }, [props.lines]);

    useEffect(() => {
        if (tempCanvas.current && tempContext.current && drawingCanvas.current) {
            if (isPanning) {
                copyFromCanvasToContext(tempContext.current, drawingCanvas.current, 0, 0);
                panOffset.current = { ...mapPosition };
            } else {
                clear2(tempContext.current, tempCanvas.current.width, tempCanvas.current.height);
            }
        }
    }, [isPanning]);

    useEffect(() => {
        if (tempCanvas.current && drawingCanvas.current && drawingContext.current && panOffset.current) {
            clear2(drawingContext.current, drawingCanvas.current.width, drawingCanvas.current.height);
            copyFromCanvasToContext(
                drawingContext.current,
                tempCanvas.current,
                panOffset.current.x - mapPosition.x,
                panOffset.current.y - mapPosition.y
            );
        }
    }, [mapPosition]);

    useEffect(() => {
        if (drawingCanvas.current && tempCanvas.current) {
            resizeCanvas(drawingCanvas.current, width, height);
            resizeCanvas(tempCanvas.current, width, height);
        }
        reContext();
        redraw();
    }, [width, height]);

    return (
        <>
            <TempCanvas ref={tempCanvas} />
            <DrawingCanvas ref={drawingCanvas} />
        </>
    );
};

export default Drawing;
