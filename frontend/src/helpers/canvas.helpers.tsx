import { Line, Point } from '../models';
import { RefObject } from 'react';
import { CanvasSettings } from '../models/canvas';

import pan from '../assets/cursors/pan.svg';
import pen from '../assets/cursors/pen.svg';

export const drawGrid = (context: CanvasRenderingContext2D, mapPosition: Point) => {
    context.beginPath();
    context.strokeStyle = 'rgba(150,150,150,.3)';
    context.lineWidth = 0.2;

    const gridSize = 25;

    let countX = -(mapPosition.x % gridSize);
    while (countX < context.canvas.width) {
        countX += gridSize;
        context.moveTo(countX, 0);
        context.lineTo(countX, context.canvas.height);
    }
    context.stroke();

    let countY = -(mapPosition.y % gridSize);
    while (countY < context.canvas.height) {
        countY += gridSize;
        context.moveTo(0, countY);
        context.lineTo(context.canvas.width, countY);
    }
    context.stroke();
};

export const drawBrush = (context: CanvasRenderingContext2D, pointer: Point, canvasSettings: CanvasSettings, isPanning: boolean) => {
    if (isPanning) {
        const img = new Image();
        img.src = pan;

        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        context.drawImage(img, pointer.x, pointer.y, 40, 40);
        return;
    }

    const img = new Image();
    img.src = pen;

    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.beginPath();
    context.fillStyle = canvasSettings.brushColor;
    context.arc(pointer.x, pointer.y, canvasSettings.brushWidth, 0, Math.PI * 2, true);
    context.fill();
    context.drawImage(img, pointer.x, pointer.y, 40, 40);
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

export const drawPoints2 = (
    context: CanvasRenderingContext2D,
    points: Point[],
    mapPosition: Point,
    brushColor: string,
    brushWidth: number
) => {
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.strokeStyle = brushColor;
    context.lineWidth = brushWidth * 2;

    let p1 = toRelative(points[0], mapPosition);

    if (points.length === 1) {
        context.beginPath();
        context.arc(points[0].x, points[0].y, 1, 0, 2 * Math.PI, true);
        context.stroke();
        return;
    }

    let p2 = toRelative(points[1], mapPosition);

    context.moveTo(p2.x, p2.y);
    context.beginPath();

    for (let i = 1, len = points.length; i < len; i++) {
        // we pick the point between pi+1 & pi+2 as the
        // end point and p1 as our control point
        const midPoint = midPointBtw(p1, p2);
        context.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
        p1 = toRelative(points[i], mapPosition);
        i + 1 !== len && (p2 = toRelative(points[i + 1], mapPosition));
    }
    // Draw last line as a straight line while
    // we wait for the next point to be able to calculate
    // the bezier control point
    context.lineTo(p1.x, p1.y);
    context.stroke();
};

export const drawLines = (context: CanvasRenderingContext2D, lines: Line[], mapPosition: Point) => {
    lines.forEach(line => {
        const { points, brushColor, brushWidth } = line;
        drawPoints2(context, points, mapPosition, brushColor, brushWidth);
    });
};

export const clear2 = (context: CanvasRenderingContext2D) => {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
};

export const copyFromCanvasToContext = (to: CanvasRenderingContext2D, from: HTMLCanvasElement, xOffset: number, yOffset: number) => {
    to.drawImage(from, xOffset, yOffset);
};

export const resizeCanvas = (canvas: HTMLCanvasElement, width: number, height: number) => {
    canvas.width = width;
    canvas.height = height;

    canvas.style.width = width.toString();
    canvas.style.height = height.toString();
};
