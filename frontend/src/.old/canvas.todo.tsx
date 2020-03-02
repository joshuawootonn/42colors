import React, { useEffect, useState } from 'react';
import styled from 'styled-components/';
import { useMouse, useWindowSize } from 'react-use';
import { LazyBrush } from 'lazy-brush';

function midPointBtw(p1: Point, p2: Point) {
    return {
        x: p1.x + (p2.x - p1.x) / 2,
        y: p1.y + (p2.y - p1.y) / 2,
    };
}
interface Position {
    x: number;
    y: number;
}

const Grid = styled.canvas`
    z-index: 10;
    position: absolute;
    width: 100%;
    height: 100%;
`;
const Interface = styled.canvas`
    z-index: 15;
    position: absolute;
    width: 100%;
    height: 100%;
`;
const Drawing = styled.canvas`
    z-index: 11;
    width: 100%;
    height: 100%;
`;
const Temp = styled.canvas`
    z-index: 12;
    width: 100%;
    height: 100%;
`;

// TODO GET THIS FROM THE FUCKING CLIENT DIMS
const Container = styled.div`
    display: block;
    background: whitesmoke;
    touch-action: none;
    width: 100vw;
    height: 100vh;
`;

interface CanvasObject {
    drawing: HTMLCanvasElement;
    grid: HTMLCanvasElement;
    interface: HTMLCanvasElement;
    temp: HTMLCanvasElement;
}
interface ContextObject {
    drawing: CanvasRenderingContext2D;
    grid: CanvasRenderingContext2D;
    interface: CanvasRenderingContext2D;
    temp: CanvasRenderingContext2D;
}

const useCanvasElements = (interfaceRef: any, gridRef: any, tempRef: any, drawingRef: any): CanvasObject | null => {
    if (!tempRef.current || !gridRef.current || !drawingRef.current || !interfaceRef.current) {
        return null;
    }
    return {
        temp: tempRef.current as HTMLCanvasElement,
        grid: gridRef.current as HTMLCanvasElement,
        interface: interfaceRef.current as HTMLCanvasElement,
        drawing: drawingRef.current as HTMLCanvasElement,
    };
};
const useCanvasContexts = (interfaceRef: any, gridRef: any, tempRef: any, drawingRef: any): ContextObject | null => {
    const elements = useCanvasElements(interfaceRef, gridRef, tempRef, drawingRef);
    if (elements === null) return null;
    return {
        temp: elements.temp.getContext('2d') as CanvasRenderingContext2D,
        interface: elements.interface.getContext('2d') as CanvasRenderingContext2D,
        grid: elements.grid.getContext('2d') as CanvasRenderingContext2D,
        drawing: elements.drawing.getContext('2d') as CanvasRenderingContext2D,
    };
};

export interface CanvasProps {
    brushColor: string;
    brushRadius: number;
}

export interface Point {
    x: number;
    y: number;
}

export interface Line {
    points: Point[];
    brushColor: string;
    brushWidth: number;
}

const CanvasTodo: React.FC<CanvasProps> = ({ brushColor, brushRadius }) => {
    const interfaceRef = React.useRef<HTMLCanvasElement>(null);
    const gridRef = React.useRef<HTMLCanvasElement>(null);
    const tempRef = React.useRef<HTMLCanvasElement>(null);
    const drawingRef = React.useRef<HTMLCanvasElement>(null);
    const context = useCanvasContexts(interfaceRef, gridRef, tempRef, drawingRef);
    const elements = useCanvasElements(interfaceRef, gridRef, tempRef, drawingRef);

    const { docX: mouseX, docY: mouseY } = useMouse(interfaceRef);
    const { height: windowHeight, width: windowWidth } = useWindowSize();

    const [lazy, setLazy] = useState(
        new LazyBrush({
            radius: 10 * window.devicePixelRatio,
            enabled: true,
            initialPoint: {
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
            },
        })
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [isPressing, setIsPressing] = useState<boolean>(false);
    const [mouseHasMoved, setMouseHasMoved] = useState(true);
    const [points, setPoints] = useState<Point[]>([]);
    const [lines, setLines] = useState<Line[]>([]);

    const saveLine = () => {
        if (points.length < 2 || elements === null || context === null) return;

        setLines([
            ...lines,
            {
                points: [...points],
                brushColor,
                brushWidth: brushRadius,
            },
        ]);

        setPoints([]);

        const width = elements.temp.width;
        const height = elements.temp.height;

        context.drawing.drawImage(elements.temp, 0, 0, width, height);
        context.temp.clearRect(0, 0, width, height);
    };
    const setCanvasSize = (canvas: HTMLCanvasElement, width: number, height: number) => {
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = width.toString();
        canvas.style.height = height.toString();
    };

    const drawInterface = (x: number, y: number) => {
        if (elements === null || context === null) return;
        const { interface: interfaceContext } = context;
        // Draw brush point (the one in the middle of the brush preview)
        interfaceContext.beginPath();
        interfaceContext.fillStyle = '#0a0302';
        interfaceContext.arc(x, y, 2, 0, Math.PI * 2, true);
        interfaceContext.fill();
        interfaceContext.stroke();
    };
    const drawGrid = () => {
        if (elements === null || context === null) return;
        const { grid } = context;
        const gridWidth = elements.grid.width,
            gridHeight = elements.grid.height;
        grid.clearRect(0, 0, gridWidth, gridHeight);

        grid.beginPath();
        grid.setLineDash([]);
        grid.setLineDash([]);
        grid.strokeStyle = 'rgba(150,150,150,0.77)';
        grid.lineWidth = 0.1;

        const gridSize = 25;

        let countX = 0;
        while (countX < gridWidth) {
            countX += gridSize;
            grid.moveTo(countX, 0);
            grid.lineTo(countX, gridHeight);
        }
        grid.stroke();

        let countY = 0;
        while (countY < gridHeight) {
            countY += gridSize;
            grid.moveTo(0, countY);
            grid.lineTo(gridWidth, countY);
        }
        grid.stroke();
    };
    const getPointerPosition = (e: MouseEvent): Position => {
        if (!elements)
            return {
                x: 0,
                y: 0,
            };
        const rect = elements.interface.getBoundingClientRect();

        // use cursor pos as default
        const clientX = e.clientX;
        const clientY = e.clientY;

        // use first touch if available
        // if (e.changedTouches && e.changedTouches.length > 0) {
        //   clientX = e.changedTouches[0].clientX;
        //   clientY = e.changedTouches[0].clientY;
        // }

        // return mouse/touch position inside canvas
        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    };

    const drawPoints = ({ points, brushColor, brushWidth }: Line) => {
        if (!context) return;

        console.log('DRAWING');
        context.temp.lineJoin = 'round';
        context.temp.lineCap = 'round';
        context.temp.strokeStyle = brushColor;

        // context.temp.clearRect(0, 0, context.temp.canvas.width, context.temp.canvas.height);
        context.temp.lineWidth = brushWidth * 2;

        let p1 = points[0];
        let p2 = points[1];

        context.temp.moveTo(p2.x, p2.y);
        context.temp.beginPath();

        for (let i = 1, len = points.length; i < len; i++) {
            // we pick the point between pi+1 & pi+2 as the
            // end point and p1 as our control point
            const midPoint = midPointBtw(p1, p2);
            context.temp.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
            p1 = points[i];
            p2 = points[i + 1];
        }
        // Draw last line as a straight line while
        // we wait for the next point to be able to calculate
        // the bezier control point
        context.temp.lineTo(p1.x, p1.y);
        context.temp.stroke();
    };
    const handlePointerMove = (x: number, y: number) => {
        const hasChanged = lazy.update({ x, y });
        const isDisabled = !lazy.isEnabled();

        if ((isPressing && hasChanged && !isDrawing) || (isDisabled && isPressing)) {
            // Start drawing and add point
            setIsDrawing(true);
            points.push(lazy.brush.toObject());
        }

        if (isDrawing && (lazy.brushHasMoved() || isDisabled) && points.length > 1) {
            // Add new point
            setPoints([...points, lazy.brush.toObject()]);

            console.log(points.length);
            // Draw current points
            drawPoints({
                points,
                brushColor,
                brushWidth: brushRadius,
            });
        }
        setMouseHasMoved(true);
    };
    const handleMouseMove = (e: MouseEvent) => {
        const { x, y } = getPointerPosition(e);
        handlePointerMove(x, y);

        // console.log(lines, points);
    };
    const handleMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        setIsPressing(true);
    };

    const handleMouseUp = (e: MouseEvent) => {
        e.preventDefault();
        setIsPressing(false);
        setIsDrawing(false);
        saveLine();
    };

    useEffect(() => {
        if (elements === null || context === null) return;
        const gridCanvas = elements.grid;
        setCanvasSize(gridCanvas, windowWidth, windowHeight);
        const interfaceCanvas = elements.interface;
        setCanvasSize(interfaceCanvas, windowWidth, windowHeight);
        drawGrid();
    }, [elements, context]);

    return (
        <Container>
            <Grid ref={gridRef} />
            <Interface
                ref={interfaceRef}
                onMouseDown={handleMouseDown as any}
                onMouseMove={handleMouseMove as any}
                onMouseUp={handleMouseUp as any}
            />
            <Temp ref={tempRef} />
            <Drawing ref={drawingRef} />
        </Container>
    );
};
export {};
export default CanvasTodo;
