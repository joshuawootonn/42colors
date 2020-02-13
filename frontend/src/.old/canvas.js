import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { LazyBrush } from 'lazy-brush';
import { Catenary } from 'catenary-curve';
import { drawInterface } from '../helpers/canvas.helpers';

import { postLine } from '../repositories/canvas.repositories';

function midPointBtw(p1, p2) {
    return {
        x: p1.x + (p2.x - p1.x) / 2,
        y: p1.y + (p2.y - p1.y) / 2,
    };
}

const canvasStyle = {
    display: 'block',
    position: 'absolute',
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

const dimensionsPropTypes = PropTypes.oneOfType([PropTypes.number, PropTypes.string]);

export default class extends PureComponent {
    static propTypes = {
        loadTimeOffset: PropTypes.number,
        lazyRadius: PropTypes.number,
        brushRadius: PropTypes.number,
        brushColor: PropTypes.string,
        catenaryColor: PropTypes.string,
        gridColor: PropTypes.string,
        backgroundColor: PropTypes.string,
        hideGrid: PropTypes.bool,
        canvasWidth: dimensionsPropTypes,
        canvasHeight: dimensionsPropTypes,
        disabled: PropTypes.bool,
        imgSrc: PropTypes.string,
        saveData: PropTypes.string,
        immediateLoading: PropTypes.bool,
    };

    static defaultProps = {
        loadTimeOffset: 5,
        lazyRadius: 12,
        brushRadius: 10,
        brushColor: '#444',
        catenaryColor: '#0a0302',
        gridColor: 'rgba(150,150,150,0.17)',
        backgroundColor: '#FFF',
        hideGrid: false,
        canvasWidth: 400,
        canvasHeight: 400,
        disabled: false,
        imgSrc: '',
        saveData: '',
        immediateLoading: false,
    };

    constructor(props) {
        super(props);

        this.canvas = {};
        this.ctx = {};

        this.catenary = new Catenary();

        this.points = [];
        this.lines = [];

        this.mouseHasMoved = true;
        this.valuesChanged = true;
        this.isDrawing = false;
        this.isPressing = false;
    }

    componentDidMount() {
        this.lazy = new LazyBrush({
            radius: this.props.lazyRadius * window.devicePixelRatio,
            enabled: true,
            initialPoint: {
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
            },
        });
        this.chainLength = this.props.lazyRadius * window.devicePixelRatio;

        this.loop();
        window.setTimeout(() => {
            const initX = window.innerWidth / 2;
            const initY = window.innerHeight / 2;
            this.lazy.update({ x: initX - this.chainLength / 4, y: initY }, { both: true });
            this.lazy.update({ x: initX + this.chainLength / 4, y: initY }, { both: false });
            this.mouseHasMoved = true;
            this.valuesChanged = true;
            this.clear();

            // Load saveData from prop if it exists
            if (this.props.saveData) {
                this.loadSavedLines(this.props.saveData);
            }
        }, 100);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.lazyRadius !== this.props.lazyRadius) {
            // Set new lazyRadius values
            this.chainLength = this.props.lazyRadius * window.devicePixelRatio;
            this.lazy.setRadius(this.props.lazyRadius * window.devicePixelRatio);
        }

        if (prevProps.saveData !== this.props.saveData) {
            this.loadSavedLines(this.props.saveData);
        }

        if (JSON.stringify(prevProps) !== JSON.stringify(this.props)) {
            // Signal this.loop function that values changed
            this.valuesChanged = true;
        }
    }

    loadSavedLines = (lines, immediate = this.props.immediateLoading) => {
        this.clear();
        this.simulateDrawingLines({
            lines,
            immediate: true,
        });
    };

    simulateDrawingLines = ({ lines, immediate }) => {
        // Simulate live-drawing of the loaded lines
        // TODO use a generator
        let curTime = 0;
        const timeoutGap = immediate ? 0 : this.props.loadTimeOffset;

        lines.forEach(line => {
            const { points, brushColor, brushRadius } = line;

            for (let i = 1; i < points.length; i++) {
                curTime += timeoutGap;
                window.setTimeout(() => {
                    this.drawPoints({
                        points: points.slice(0, i + 1),
                        brushColor,
                        brushRadius,
                    });
                }, curTime);
            }

            curTime += timeoutGap;
            window.setTimeout(() => {
                // Save this line with its props instead of this.props
                this.points = points;
                this.saveLine({ brushColor, brushRadius });
            }, curTime);
        });
    };

    handleTouchStart = e => {
        const { x, y } = this.getPointerPos(e);
        this.lazy.update({ x, y }, { both: true });
        this.handleMouseDown(e);

        this.mouseHasMoved = true;
    };

    handleTouchMove = e => {
        e.preventDefault();
        const { x, y } = this.getPointerPos(e);
        this.handlePointerMove(x, y);
    };

    handleTouchEnd = e => {
        this.handleMouseUp(e);
        const brush = this.lazy.getBrushCoordinates();
        this.lazy.update({ x: brush.x, y: brush.y }, { both: true });
        this.mouseHasMoved = true;
    };

    handleMouseDown = e => {
        e.preventDefault();
        this.isPressing = true;
    };

    handleMouseMove = e => {
        const { x, y } = this.getPointerPos(e);
        this.handlePointerMove(x, y);
    };

    handleMouseUp = e => {
        e.preventDefault();
        this.isDrawing = false;
        this.isPressing = false;

        this.saveLine();
    };

    getPointerPos = e => {
        const rect = this.canvas.interface.getBoundingClientRect();

        // use cursor pos as default
        let clientX = e.clientX;
        let clientY = e.clientY;

        // use first touch if available
        if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        }

        // return mouse/touch position inside canvas
        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    };

    handlePointerMove = (x, y) => {
        if (this.props.disabled) return;

        const hasChanged = this.lazy.update({ x, y });
        const isDisabled = !this.lazy.isEnabled();

        if ((this.isPressing && hasChanged && !this.isDrawing) || (isDisabled && this.isPressing)) {
            // Start drawing and add point
            this.isDrawing = true;
            this.points.push(this.lazy.brush.toObject());
        }

        if (this.isDrawing && (this.lazy.brushHasMoved() || isDisabled)) {
            // Add new point
            this.points.push(this.lazy.brush.toObject());

            // Draw current points
            this.drawPoints({
                points: this.points,
                brushColor: this.props.brushColor,
                brushRadius: this.props.brushRadius,
            });
        }

        this.mouseHasMoved = true;
    };

    drawPoints = ({ points, brushColor, brushRadius }) => {
        this.ctx.temp.lineJoin = 'round';
        this.ctx.temp.lineCap = 'round';
        this.ctx.temp.strokeStyle = brushColor;

        this.ctx.temp.clearRect(0, 0, this.ctx.temp.canvas.width, this.ctx.temp.canvas.height);
        this.ctx.temp.lineWidth = brushRadius * 2;

        let p1 = points[0];
        let p2 = points[1];

        this.ctx.temp.moveTo(p2.x, p2.y);
        this.ctx.temp.beginPath();

        for (let i = 1, len = points.length; i < len; i++) {
            // we pick the point between pi+1 & pi+2 as the
            // end point and p1 as our control point
            const midPoint = midPointBtw(p1, p2);
            this.ctx.temp.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
            p1 = points[i];
            p2 = points[i + 1];
        }
        // Draw last line as a straight line while
        // we wait for the next point to be able to calculate
        // the bezier control point
        this.ctx.temp.lineTo(p1.x, p1.y);
        this.ctx.temp.stroke();
    };

    saveLine = ({ brushColor, brushRadius } = {}) => {
        if (this.points.length < 2) return;

        const line = {
            points: [...this.points],
            brushColor: brushColor || this.props.brushColor,
            brushRadius: brushRadius || this.props.brushRadius,
        };

        postLine(line);

        // Save as new line
        this.lines.push(line);

        // Reset points array
        this.points.length = 0;

        const width = this.canvas.temp.width;
        const height = this.canvas.temp.height;

        // Copy the line to the drawing canvas
        this.ctx.drawing.drawImage(this.canvas.temp, 0, 0, width, height);

        // Clear the temporary line-drawing canvas
        this.ctx.temp.clearRect(0, 0, width, height);
    };

    clear = () => {
        this.lines = [];
        this.valuesChanged = true;
        this.ctx.drawing.clearRect(0, 0, this.canvas.drawing.width, this.canvas.drawing.height);
        this.ctx.temp.clearRect(0, 0, this.canvas.temp.width, this.canvas.temp.height);
    };

    loop = ({ once = false } = {}) => {
        if (this.mouseHasMoved || this.valuesChanged) {
            const pointer = this.lazy.getPointerCoordinates();
            const brush = this.lazy.getBrushCoordinates();

            drawInterface(this.ctx.interface, this.lazy, this.catenary, pointer, brush, this.props.canvasSettings);
            this.mouseHasMoved = false;
            this.valuesChanged = false;
        }

        if (!once) {
            window.requestAnimationFrame(() => {
                this.loop();
            });
        }
    };

    render() {
        return (
            <div
                className={this.props.className}
                style={{
                    display: 'block',
                    background: this.props.backgroundColor,
                    touchAction: 'none',
                    width: this.props.canvasWidth,
                    height: this.props.canvasHeight,
                    ...this.props.style,
                }}
                ref={container => {
                    if (container) {
                        this.canvasContainer = container;
                    }
                }}
            >
                {canvasTypes.map(({ name, zIndex }) => {
                    const isInterface = name === 'interface';
                    return (
                        <canvas
                            key={name}
                            ref={canvas => {
                                if (canvas) {
                                    this.canvas[name] = canvas;
                                    this.ctx[name] = canvas.getContext('2d');
                                }
                            }}
                            style={{ ...canvasStyle, zIndex }}
                            onMouseDown={isInterface ? this.handleMouseDown : undefined}
                            onMouseMove={isInterface ? this.handleMouseMove : undefined}
                            onMouseUp={isInterface ? this.handleMouseUp : undefined}
                            onMouseOut={isInterface ? this.handleMouseUp : undefined}
                        />
                    );
                })}
            </div>
        );
    }
}
