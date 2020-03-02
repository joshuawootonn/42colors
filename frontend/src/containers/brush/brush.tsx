import React, { useEffect, useRef, useState } from 'react';
import { LazyBrush } from 'lazy-brush';
import { Catenary } from 'catenary-curve';

import { Point, Line } from '../../.old/canvas.todo';
import { CanvasSettings } from '../../models/canvas';
import { useWindowSize } from 'react-use';
import styled from 'styled-components';
import { drawBrush, drawPoints } from '../../helpers/canvas.helpers';
import canvas from '../../.old/canvas';

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
    canvasWidth: number | string;
    canvasHeight: number | string;
    style?: any;
    className?: any;
    canvasSettings: CanvasSettings;
}

const Brush: React.FC<BrushProps> = ({ canvasWidth = 400, canvasHeight = 400, canvasSettings, ...props }) => {
    const brushCanvas = useRef<HTMLCanvasElement>(null);
    const tempCanvas = useRef<HTMLCanvasElement>(null);
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
    const isPressing = useRef(false);
    const isDrawing = useRef(false);
    const [chainLength, setChainLength] = useState(0);
    const [points, setPoints] = useState<Point[]>([]);

    useEffect(() => {
        let animationFrame: number;
        function loop() {
            animationFrame = requestAnimationFrame(onFrame);
        }
        function onFrame() {
            if (mouseHasMoved && mouseHasMoved.current) {
                const pointer = lazy.getPointerCoordinates();
                const brush = lazy.getBrushCoordinates();

                drawBrush(brushCanvas, lazy, catenary, pointer, brush, canvasSettings);
                mouseHasMoved.current = false;
            }
            loop();
        }
        loop();
        if (canvasSettings.lazyRadius === 0) {
            lazy.disable();
        } else {
            lazy.enable();
            lazy.setRadius(canvasSettings.lazyRadius * window.devicePixelRatio);
        }

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
        lazy.update({ x, y });

        if ((isPressing.current && mouseHasMoved.current) || (!lazy.isEnabled() && isPressing.current)) {
            // Start drawing and add point
            isDrawing.current = true;
            setPoints([...points, lazy.brush.toObject()]);
        }

        if (isDrawing.current && (lazy.brushHasMoved() || !lazy.isEnabled())) {
            // Add new point
            setPoints([...points, lazy.brush.toObject()]);

            if (points.length > 0) {
                console.log(points);

                drawPoints(tempCanvas, points, canvasSettings.brushColor, canvasSettings.brushWidth);
            }
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
                ref={brushCanvas}
                onMouseDown={handleMouseDown}
                onMouseOut={handleMouseUp}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            />
            <TempCanvas
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
