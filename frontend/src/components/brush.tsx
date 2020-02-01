import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { LazyBrush } from 'lazy-brush';
import { Catenary } from 'catenary-curve';

import { postLine } from '../repositories/canvas.repositories';
import { Point } from './canvas.todo';
import { CanvasSettings } from '../models/canvas';
import canvas from './canvas';

const canvasStyle = {
    display: 'block',
    position: 'absolute',
    zIndex: 15,
};

const canvasTypes = [
    {
        name: 'interface',
        zIndex: 15,
    },
    {
        name: 'drawing',
        zIndex: 11,
    },
    {
        name: 'temp',
        zIndex: 12,
    },
    {
        name: 'grid',
        zIndex: 10,
    },
];

interface BrushProps {
    canvasWidth: number | string;
    canvasHeight: number | string;

    style?: any;
    className?: any;
    canvasSettings: CanvasSettings;
}

const Brush: React.FC<BrushProps> = ({ canvasWidth = 400, canvasHeight = 400, canvasSettings, ...props }) => {
    console.log(canvasSettings);
    const brushCanvas = useRef<HTMLCanvasElement>(null);

    const [lazy, setLazy] = useState(
        new LazyBrush({
            radius: canvasSettings.lazyRadius * window.devicePixelRatio,
            enabled: true,
            initialPoint: {
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
            },
        })
    );
    const [catenary, setCatenary] = useState(new Catenary());
    const mouseHasMoved = useRef(false);
    const [chainLength, setChainLength] = useState(0);

    const drawInterface = (pointer: Point, brush: Point, canvasSettings: CanvasSettings) => {
        console.log(canvasSettings);
        if (brushCanvas.current && brushCanvas.current.getContext('2d')) {
            const c = brushCanvas.current.getContext('2d') as any;
            c.clearRect(0, 0, c.canvas.width, c.canvas.height);

            // Draw brush preview
            c.beginPath();
            c.fillStyle = canvasSettings.brushColor;
            c.arc(brush.x, brush.y, canvasSettings.brushRadius, 0, Math.PI * 2, true);
            c.fill();

            // Draw mouse point (the one directly at the cursor)
            c.beginPath();
            c.fillStyle = canvasSettings.catenaryColor;
            c.arc(pointer.x, pointer.y, 4, 0, Math.PI * 2, true);
            c.fill();

            c.beginPath();
            c.lineWidth = 2;
            c.lineCap = 'round';
            c.setLineDash([2, 4]);
            c.strokeStyle = canvasSettings.catenaryColor;
            catenary.drawToCanvas(c, brush, pointer, canvasSettings.lazyRadius);
            c.stroke();

            // Draw brush point (the one in the middle of the brush preview)
            c.beginPath();
            c.fillStyle = canvasSettings.catenaryColor;
            c.arc(brush.x, brush.y, 2, 0, Math.PI * 2, true);
            c.fill();
        }
    };

    useEffect(() => {
        let animationFrame: number;
        function loop() {
            animationFrame = requestAnimationFrame(onFrame);
        }
        function onFrame() {
            if (mouseHasMoved && mouseHasMoved.current) {
                const pointer = lazy.getPointerCoordinates();
                const brush = lazy.getBrushCoordinates();

                drawInterface(pointer, brush, canvasSettings);
                mouseHasMoved.current = false;
            }
            loop();
        }
        loop();

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

    const getPointerPos = (e: any): Point => {
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
        const hasChanged = lazy.update({ x, y });
        const isDisabled = !lazy.isEnabled();
        //
        // if ((this.isPressing && hasChanged && !this.isDrawing) || (isDisabled && this.isPressing)) {
        //     // Start drawing and add point
        //     this.isDrawing = true;
        //     this.points.push(this.lazy.brush.toObject());
        // }
        //
        // if (this.isDrawing && (this.lazy.brushHasMoved() || isDisabled)) {
        //     // Add new point
        //     this.points.push(this.lazy.brush.toObject());
        //
        //     // Draw current points
        //     this.drawPoints({
        //         points: this.points,
        //         brushColor: this.props.brushColor,
        //         brushRadius: this.props.brushRadius,
        //     });
        // }

        mouseHasMoved.current = true;
    };

    const handleMouseDown = (e: any) => {
        e.preventDefault();
        // this.isPressing = true;
    };

    const handleMouseMove = (e: any) => {
        const { x, y } = getPointerPos(e);
        handlePointerMove(x, y);
    };

    const handleMouseUp = (e: any) => {
        e.preventDefault();
        // this.isDrawing = false;
        // this.isPressing = false;
        //
        // this.saveLine();
    };

    return (
        <canvas
            ref={brushCanvas}
            style={{ ...canvasStyle } as any}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseOut={handleMouseUp}
        />
    );
};
export default Brush;

// constructor(props: BrushProps) {
//     super(props);
//
//     this.brushCanvas = null;
//     this.brushContext = null;
//
//     this.catenary = new Catenary();
//
//     this.points = [];
//     this.lines = [];
//
//     this.mouseHasMoved = true;
//     this.valuesChanged = true;
//     this.isDrawing = false;
//     this.isPressing = false;
// }

// const componentDidMount() {

// }

// componentDidUpdate(prevProps) {
//     if (prevProps.lazyRadius !== this.props.lazyRadius) {
//         // Set new lazyRadius values
//         this.chainLength = this.props.lazyRadius * window.devicePixelRatio;
//         this.lazy.setRadius(this.props.lazyRadius * window.devicePixelRatio);
//     }
//
//     if (JSON.stringify(prevProps) !== JSON.stringify(this.props)) {
//         // Signal this.loop function that values changed
//         this.valuesChanged = true;
//     }
// }

// const saveLine = ({ brushColor, brushRadius } = {}) => {
//     if (this.points.length < 2) return;
//
//     const line = {
//         points: [...this.points],
//         brushColor: brushColor || this.props.brushColor,
//         brushRadius: brushRadius || this.props.brushRadius,
//     };
//
//     postLine(line);
//
//     // Save as new line
//     this.lines.push(line);
//
//     // Reset points array
//     this.points.length = 0;
//
//     const width = this.canvas.temp.width;
//     const height = this.canvas.temp.height;
//
//     // Copy the line to the drawing canvas
//     this.ctx.drawing.drawImage(this.canvas.temp, 0, 0, width, height);
//
//     // Clear the temporary line-drawing canvas
//     this.ctx.temp.clearRect(0, 0, width, height);
// };
//
//
//
