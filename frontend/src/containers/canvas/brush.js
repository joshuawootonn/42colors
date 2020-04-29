import React, { useEffect, useRef, useState } from 'react';
import { LazyBrush } from 'lazy-brush';

import { useWindowSize } from 'react-use';
import styled from 'styled-components';
import {
    clear2,
    drawBrush,
    drawPoints2,
    resizeCanvas,
    toAbsolute,
} from '../../helpers/canvas.helpers';
import { useMapPosition } from '../../context/mapPosition/mapPosition.context';

const BrushCanvas = styled.canvas`
    display: block;
    position: absolute;
    z-index: 15;
    cursor: none;
    background-color: transparent;
`;

const TempCanvas = styled.canvas`
    display: block;
    position: absolute;
    z-index: 12;

    background-color: transparent;
`;

const Brush = ({ canvasSettings, ...props }) => {
    const brushCanvas = useRef();
    const brushContext = useRef();
    const tempCanvas = useRef();
    const tempContext = useRef();
    const { width, height } = useWindowSize();
    const [isPanning, mapPosition] = useMapPosition();

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
    const isOut = useRef(false);
    const [points, setPoints] = useState([]);

    useEffect(() => {
        brushContext.current = brushCanvas.current.getContext('2d');
        tempContext.current = tempCanvas.current.getContext('2d');
    }, []);

    useEffect(() => {
        let animationFrame;
        function loop() {
            animationFrame = requestAnimationFrame(onFrame);
        }
        function onFrame() {
            if (!isOut.current) {
                const pointer = lazy.current.getPointerCoordinates();
                drawBrush(brushContext.current, pointer, canvasSettings, isPanning);
                mouseHasMoved.current = false;
            }
            loop();
        }
        loop();
        return () => {
            cancelAnimationFrame(animationFrame);
        };
    }, [canvasSettings, isPanning, isOut.current]);

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
        resizeCanvas(brushCanvas.current, width, height);
        resizeCanvas(tempCanvas.current, width, height);
        brushContext.current = brushCanvas.current.getContext('2d');
        tempContext.current = tempCanvas.current.getContext('2d');
    }, [width, height]);

    useEffect(() => {
        clear2(tempContext.current);
    }, [mapPosition]);

    const saveLine = () => {
        if (points.length < 2) return;

        props.onNewLine({
            points,
            brushColor: canvasSettings.brushColor,
            brushWidth: canvasSettings.brushWidth,
        });
        setPoints([]);
    };

    const getPointerPos = e => {
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

    const handlePointerMove = (x, y) => {
        lazy.current.update({ x, y });

        const newRelativePoint = lazy.current.brush.toObject();
        const newAbsolutePoint = toAbsolute(newRelativePoint, mapPosition);

        const newLine = [...points, newAbsolutePoint];

        if (isPressing.current) {
            setPoints(newLine);
            isDrawing.current = true;
        }

        if (isDrawing.current && lazy.current.brushHasMoved() && points.length > 0) {
            drawPoints2(
                tempContext.current,
                [points[points.length - 1], newAbsolutePoint],
                mapPosition,
                canvasSettings.brushColor,
                canvasSettings.brushWidth
            );
        }

        mouseHasMoved.current = true;
    };

    const handleMouseMove = e => {
        const { x, y } = getPointerPos(e);
        isOut.current = false;
        handlePointerMove(x, y);
    };

    const handleMouseDown = e => {
        e.preventDefault();
        isPressing.current = true;
    };

    const handleMouseUp = e => {
        e.preventDefault();
        isDrawing.current = false;
        isPressing.current = false;

        saveLine();
    };

    const handleMouseOut = e => {
        e.preventDefault();
        handleMouseUp(e);
        isOut.current = true;
        clear2(brushContext.current);
    };

    return (
        <>
            <BrushCanvas
                data-test="brush canvas"
                ref={brushCanvas}
                onMouseDown={handleMouseDown}
                onMouseOut={handleMouseOut}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            />
            <TempCanvas
                data-test="temp canvas"
                ref={tempCanvas}
                onMouseDown={handleMouseDown}
                onMouseOut={handleMouseOut}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            />
        </>
    );
};
export default Brush;
