import React, { useEffect, useRef, useState } from 'react';
import { LazyBrush } from 'lazy-brush';
import { useWindowSize } from 'react-use';
import { css } from 'styled-components/macro';
import {
    clear,
    drawBrush,
    drawPoints,
    resizeCanvas,
    toAbsolute,
} from '../../helpers/canvas.helpers';
import { useMapPosition } from '../../context/mapPosition/mapPosition.context';

const styles = {
    root: css`
        display: block;
        position: absolute;
        z-index: 15;
        cursor: none;
        background-color: transparent;
    `,
};

const Brush = ({ canvasSettings, ...props }) => {
    const brushCanvas = useRef();
    const brushContext = useRef();
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
    const isOut = useRef(false);
    const points = useRef([]);

    useEffect(() => {
        brushContext.current = brushCanvas.current.getContext('2d');
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
                if (points.current.length > 1) {
                    drawPoints(
                        brushContext.current,
                        points.current,
                        mapPosition,
                        canvasSettings.brushColor,
                        canvasSettings.brushWidth
                    );
                }
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
        }, 100);
    }, []);

    useEffect(() => {
        resizeCanvas(brushCanvas.current, width, height);
        brushContext.current = brushCanvas.current.getContext('2d');
    }, [width, height]);

    const saveLine = () => {
        if (points.current.length < 2) return;

        props.onNewLine({
            points: points.current,
            brushColor: canvasSettings.brushColor,
            brushWidth: canvasSettings.brushWidth,
        });
        points.current = [];
    };

    const getPointerPos = e => {
        if (brushCanvas.current) {
            const rect = brushCanvas.current.getBoundingClientRect();

            const clientX = e.clientX;
            const clientY = e.clientY;

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

        if (isPressing.current) {
            points.current = [...points.current, newAbsolutePoint];
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
        isPressing.current = false;
        saveLine();
    };

    const handleMouseOut = e => {
        e.preventDefault();
        handleMouseUp(e);
        isOut.current = true;
        clear(brushContext.current);
    };

    return (
        <canvas
            css={styles.root}
            data-test="brush canvas"
            ref={brushCanvas}
            onMouseDown={handleMouseDown}
            onMouseOut={handleMouseOut}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
        />
    );
};
export default Brush;
