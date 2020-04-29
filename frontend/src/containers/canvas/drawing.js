import React, { useEffect, useRef } from 'react';

import { useWindowSize } from 'react-use';
import styled from 'styled-components';
import {
    clear2,
    copyFromCanvasToContext,
    drawBrush,
    drawLines,
    midPointBtw,
    resizeCanvas,
    toRelative,
} from '../../helpers/canvas.helpers';
import { useMapPosition } from '../../context/mapPosition/mapPosition.context';
import { Graphics, Stage } from '@inlet/react-pixi';

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
    const shouldRender = useRef(false);
    // const panOffset = useRef({ x: 0, y: 0 });

    // useEffect(() => {
    //     let animationFrame;
    //     function render() {
    //         if (drawingContext.current) {
    //             clear2(drawingContext.current);
    //             drawLines(drawingContext.current, props.lines.slice(0, 1), mapPosition);
    //         }
    //         animationFrame = requestAnimationFrame(render);
    //     }
    //     render();
    //     return () => {
    //         cancelAnimationFrame(animationFrame);
    //     };
    // }, [props.lines]);
    //
    // useEffect(() => {
    //     drawingContext.current = drawingCanvas.current.getContext('2d');
    //     tempContext.current = tempCanvas.current.getContext('2d');
    // }, []);

    // useEffect(() => {
    //     clear2(drawingContext.current);
    //     drawLines(drawingContext.current, props.lines, mapPosition);
    // }, [props.lines]);

    // useEffect(() => {
    //     if (isPanning) {
    //         copyFromCanvasToContext(tempContext.current, drawingCanvas.current, 0, 0);
    //         panOffset.current = { ...mapPosition };
    //     } else {
    //         clear2(tempContext.current);
    //     }
    // }, [isPanning]);
    //
    useEffect(() => {
        shouldRender.current = true;
        console.log(mapPosition);
    }, [mapPosition]);

    // useEffect(() => {
    //     resizeCanvas(drawingCanvas.current, width, height);
    //     resizeCanvas(tempCanvas.current, width, height);
    //     drawingContext.current = drawingCanvas.current.getContext('2d');
    //     tempContext.current = tempCanvas.current.getContext('2d');
    //     clear2(drawingContext.current);
    //     drawLines(drawingContext.current, props.lines, mapPosition);
    // }, [width, height]);

    return (
        <Stage
            width={window.innerWidth}
            height={window.innerHeight}
            options={{ backgroundColor: 0xffffff }}
        >
            <Graphics
                preventRedraw={false}
                tra
                draw={g => {
                    // clear the graphics

                    if (!props.lines.length) {
                        return;
                    }
                    g.clear();

                    for (let i = 0; i < 1; i++) {
                        const currentLine = props.lines[i];
                        const points = currentLine.points;

                        if (currentLine.points.length < 2) {
                            return;
                        }

                        let p1 = toRelative(points[0], mapPosition);

                        let p2 = toRelative(points[1], mapPosition);

                        g.lineStyle(
                            currentLine.brushWidth,
                            0x000000 + parseInt(currentLine.brushColor.substr(1))
                        );
                        g.moveTo(currentLine.points[0].x, currentLine.points[0].y);

                        for (let j = 1, len = points.length; j < len; j++) {
                            // we pick the point between pi+1 & pi+2 as the
                            // end point and p1 as our control point
                            const midPoint = midPointBtw(p1, p2);
                            g.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
                            p1 = toRelative(points[j], mapPosition);
                            j + 1 !== len && (p2 = toRelative(points[j + 1], mapPosition));
                        }

                        // g.endFill();

                        g.closePath();
                    }
                    shouldRender.current = false;
                }}
            />
        </Stage>
    );
};

export default Drawing;
