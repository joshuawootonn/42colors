import { Point } from '../.old/canvas.todo';
import { lazy, MutableRefObject, RefObject } from 'react';
import { CanvasSettings } from '../models/canvas';

export const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.beginPath();
    ctx.setLineDash([5, 1]);
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(150,150,150,0.17)';
    ctx.lineWidth = 0.5;

    const gridSize = 25;

    let countX = 0;
    while (countX < ctx.canvas.width) {
        countX += gridSize;
        ctx.moveTo(countX, 0);
        ctx.lineTo(countX, ctx.canvas.height);
    }
    ctx.stroke();

    let countY = 0;
    while (countY < ctx.canvas.height) {
        countY += gridSize;
        ctx.moveTo(0, countY);
        ctx.lineTo(ctx.canvas.width, countY);
    }
    ctx.stroke();
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

export const drawPoints = (canvas: RefObject<HTMLCanvasElement>, points: Point[], brushColor: string, brushWidth: number) => {
    if (canvas.current && canvas.current.getContext('2d')) {
        const c = canvas.current.getContext('2d') as any;
        c.lineJoin = 'round';
        c.lineCap = 'round';
        c.strokeStyle = brushColor;

        c.lineWidth = brushWidth * 2;
        if (points.length === 1) {
            c.beginPath();
            c.arc(points[0].x, points[0].y, 1, 0, 2 * Math.PI, true);
            c.stroke();
            return;
        }

        let p1 = points[0];
        let p2 = points[1];

        c.moveTo(p2.x, p2.y);
        c.beginPath();

        for (let i = 1, len = points.length; i < len; i++) {
            // we pick the point between pi+1 & pi+2 as the
            // end point and p1 as our control point
            const midPoint = midPointBtw(p1, p2);
            c.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
            p1 = points[i];
            p2 = points[i + 1];
        }
        // Draw last line as a straight line while
        // we wait for the next point to be able to calculate
        // the bezier control point
        c.lineTo(p1.x, p1.y);
        c.stroke();
    }
};
