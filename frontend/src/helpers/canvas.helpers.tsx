import { Point } from '../models';
import { RefObject } from 'react';
import { CanvasSettings } from '../models/canvas';

export const drawGrid = (canvas: RefObject<HTMLCanvasElement>, mapPosition: Point) => {
    if (canvas.current && canvas.current.getContext('2d')) {
        const c = canvas.current.getContext('2d') as any;
        c.clearRect(0, 0, c.canvas.width, c.canvas.height);

        c.beginPath();
        c.strokeStyle = 'rgba(150,150,150,.3)';
        c.lineWidth = 0.2;

        const gridSize = 25;

        let countX = -(mapPosition.x % gridSize);
        while (countX < c.canvas.width) {
            countX += gridSize;
            c.moveTo(countX, 0);
            c.lineTo(countX, c.canvas.height);
        }
        c.stroke();

        let countY = -(mapPosition.y % gridSize);
        while (countY < c.canvas.height) {
            countY += gridSize;
            c.moveTo(0, countY);
            c.lineTo(c.canvas.width, countY);
        }
        c.stroke();
    }
};

export const drawBrush = (canvas: RefObject<HTMLCanvasElement>, pointer: Point, canvasSettings: CanvasSettings) => {
    if (canvas.current && canvas.current.getContext('2d')) {
        const c = canvas.current.getContext('2d') as any;
        c.clearRect(0, 0, c.canvas.width, c.canvas.height);

        c.beginPath();
        c.fillStyle = canvasSettings.brushColor;
        c.arc(pointer.x, pointer.y, canvasSettings.brushWidth, 0, Math.PI * 2, true);
        c.fill();
    }
};

function midPointBtw(p1: Point, p2: Point) {
    return {
        x: p1.x + (p2.x - p1.x) / 2,
        y: p1.y + (p2.y - p1.y) / 2,
    };
}

export const toRelative = (point: Point, mapPosition: Point): Point => {
    return { x: point.x - mapPosition.x, y: point.y - mapPosition.y };
};
export const toAbsolute = (point: Point, mapPosition: Point): Point => {
    return { x: point.x + mapPosition.x, y: point.y + mapPosition.y };
};

export const drawPoints = (
    canvas: RefObject<HTMLCanvasElement>,
    points: Point[],
    mapPosition: Point,
    brushColor: string,
    brushWidth: number
) => {
    if (canvas.current && canvas.current.getContext('2d')) {
        const c = canvas.current.getContext('2d') as any;
        c.lineJoin = 'round';
        c.lineCap = 'round';
        c.strokeStyle = brushColor;
        c.lineWidth = brushWidth * 2;

        let p1 = toRelative(points[0], mapPosition);

        if (points.length === 1) {
            c.beginPath();
            c.arc(points[0].x, points[0].y, 1, 0, 2 * Math.PI, true);
            c.stroke();
            return;
        }

        let p2 = toRelative(points[1], mapPosition);

        c.moveTo(p2.x, p2.y);
        c.beginPath();

        for (let i = 1, len = points.length; i < len; i++) {
            // we pick the point between pi+1 & pi+2 as the
            // end point and p1 as our control point
            const midPoint = midPointBtw(p1, p2);
            c.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
            p1 = toRelative(points[i], mapPosition);
            i + 1 !== len && (p2 = toRelative(points[i + 1], mapPosition));
        }
        // Draw last line as a straight line while
        // we wait for the next point to be able to calculate
        // the bezier control point
        c.lineTo(p1.x, p1.y);
        c.stroke();
    }
};

export const clear = (canvas: RefObject<HTMLCanvasElement>) => {
    if (canvas.current && canvas.current.getContext('2d')) {
        const context = canvas.current.getContext('2d') as any;
        const boundedClientRect = canvas.current.getBoundingClientRect();
        context.clearRect(0, 0, boundedClientRect.width, boundedClientRect.height);
    }
};
