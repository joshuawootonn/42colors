// place files you want to import through the `$lib` alias in this folder.

export type Mode = 'pencil' | 'pan';

export enum State {
	Initializing = 'initializing',
	Working = 'working'
}

export type Store =
	| {
			state: State.Initializing;
	  }
	| {
			state: State.Working;
			canvas: HTMLCanvasElement;
			context: CanvasRenderingContext2D;
			mode: Mode;
	  };

export class PanTool {
	constructor(private readonly canvas: Canvas) {}

	onPointerDown(e: PointerEvent) {
		const startingCamera = this.canvas.camera.clone();
		const startingX = e.clientX;
		const startingY = e.clientY;

		const pan = (e: PointerEvent) => {
			this.canvas.camera.x = startingCamera.x - e.clientX + startingX;
			this.canvas.camera.y = startingCamera.y - e.clientY + startingY;
		};

		this.canvas.canvas.addEventListener('pointermove', pan);
		this.canvas.canvas.addEventListener(
			'pointerup',
			(e: PointerEvent) => {
				pan(e);
				this.canvas.canvas.removeEventListener('pointermove', pan);
			},
			{ once: true }
		);
	}
}

export class PencilTool {
	constructor(private readonly canvas: Canvas) {}

	onPointerDown(e: PointerEvent) {
		console.log('pencil onPointerDown');
		const draw = (e: PointerEvent) => {
			const camera = this.canvas.camera;

			const x = roundDown(camera.x + e.clientX);
			const y = roundDown(camera.y + e.clientY);

			this.canvas.blocks.push({ x, y });
		};

		this.canvas.canvas.addEventListener('pointermove', draw);
		this.canvas.canvas.addEventListener(
			'pointerup',
			(e: PointerEvent) => {
				draw(e);
				this.canvas.canvas.removeEventListener('pointermove', draw);
			},
			{ once: true }
		);
	}
}

function roundDown(num: number) {
	return num - (num % 5);
}

type Block = {
	x: number;
	y: number;
};

const initialBlocks: Block[] = [
	{ x: 130, y: 190 },
	{ x: 75, y: 640 },
	{ x: 90, y: 640 }
];

export class Canvas {
	private rafId: number = 0;
	private panTool: PanTool;
	private pencilTool: PencilTool;
	mode: 'pencil' | 'pan' = $state('pan');
	camera: Camera = new Camera(0, 0, 1);
	blocks: Block[] = initialBlocks;

	constructor(
		readonly canvas: HTMLCanvasElement,
		readonly ctx: CanvasRenderingContext2D
	) {
		this.panTool = new PanTool(this);
		this.pencilTool = new PencilTool(this);

		this.draw = this.draw.bind(this);
		this.onPointerDown = this.onPointerDown.bind(this);

		this.draw();
		canvas.addEventListener('pointerdown', this.onPointerDown);
	}

	cleanUp() {
		this.canvas.removeEventListener('pointerdown', this.onPointerDown);
		cancelAnimationFrame(this.rafId);
	}

	setMode(mode: Mode) {
		console.log(this, mode);
		this.mode = mode;
	}

	drawBoard() {
		const buffer = 100;
		const cameraX = this.camera.x;
		const cameraY = this.camera.y;

		const startPoint = {
			x: roundDown(cameraX - buffer),
			y: roundDown(cameraY - buffer)
		};

		const endPoint = {
			x: roundDown(cameraX + this.canvas.width + buffer),
			y: roundDown(cameraY + this.canvas.height + buffer)
		};

		this.ctx.fillRect(startPoint.x, startPoint.y, 5, 5);
		this.ctx.fillRect(endPoint.x, endPoint.y, 5, 5);

		for (let x = startPoint.x; x <= endPoint.x; x += 5) {
			this.ctx.moveTo(x, startPoint.y);
			this.ctx.lineTo(x, endPoint.y);
		}

		for (let y = startPoint.y; y <= endPoint.y; y += 5) {
			this.ctx.moveTo(startPoint.x, y);
			this.ctx.lineTo(endPoint.x, y);
		}
		this.ctx.strokeStyle = '#eee';
		this.ctx.stroke();
	}

	draw() {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;

		this.ctx.translate(-this.camera.x, -this.camera.y);

		this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

		this.drawBoard();

		for (let i = 0; i < this.blocks.length; i++) {
			const block = this.blocks[i];
			this.ctx.fillRect(block.x, block.y, 5, 5);
		}

		this.rafId = requestAnimationFrame(this.draw);
	}

	onPointerDown(e: PointerEvent) {
		const mode = this.mode;

		switch (mode) {
			case 'pencil':
				this.pencilTool.onPointerDown(e);
				break;
			case 'pan':
				this.panTool.onPointerDown(e);
				break;

			default:
				console.log('default case of the onPointerDown');
		}
	}
}

export class Camera {
	x: number;
	y: number;
	zoom: number;

	constructor(x: number, y: number, zoom: number) {
		this.x = x;
		this.y = y;
		this.zoom = zoom;
	}

	clone() {
		return new Camera(this.x, this.y, this.zoom);
	}
}
