import React, { useEffect, useRef } from 'react';

import { useWindowSize } from 'react-use';
import styled from 'styled-components';
import { clear2, copyFromCanvasToContext, drawLines, resizeCanvas } from '../../helpers/canvas.helpers';
import { useMapPosition } from '../../context/mapPosition/mapPosition.context';

const DrawingCanvas = styled.canvas`
    display: block;
    position: absolute;
    z-index: 11;
`;
const TempCanvas = styled.canvas`
    display: none;
`;

const Drawing = props => {
    const drawingCanvas = useRef();
    const drawingContext = useRef();
    const tempCanvas = useRef();
    const tempContext = useRef();

    const { width, height } = useWindowSize();
    const [isPanning, mapPosition] = useMapPosition();
    const panOffset = useRef({ x: 0, y: 0 });

    useEffect(() => {
        drawingContext.current = drawingCanvas.current.getContext('2d');
        tempContext.current = tempCanvas.current.getContext('2d');
    }, []);

    useEffect(() => {
        clear2(drawingContext.current);
        drawLines(drawingContext.current, props.lines, mapPosition);
    }, [props.lines]);

    useEffect(() => {
        if (isPanning) {
            copyFromCanvasToContext(tempContext.current, drawingCanvas.current, 0, 0);
            panOffset.current = { ...mapPosition };
        } else {
            clear2(tempContext.current);
        }
    }, [isPanning]);

    useEffect(() => {
        clear2(drawingContext.current);
        copyFromCanvasToContext(
            drawingContext.current,
            tempCanvas.current,
            panOffset.current.x - mapPosition.x,
            panOffset.current.y - mapPosition.y
        );
    }, [mapPosition]);

    useEffect(() => {
        resizeCanvas(drawingCanvas.current, width, height);
        resizeCanvas(tempCanvas.current, width, height);
        drawingContext.current = drawingCanvas.current.getContext('2d');
        tempContext.current = tempCanvas.current.getContext('2d');
        clear2(drawingContext.current);
        drawLines(drawingContext.current, props.lines, mapPosition);
    }, [width, height]);

    return (
        <>
            <TempCanvas ref={tempCanvas} />
            <DrawingCanvas ref={drawingCanvas} />
        </>
    );
};

export default Drawing;
