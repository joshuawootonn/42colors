import { Point } from './canvas.todo';
import { lazy } from 'react';
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

