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
	private isDragging = false;

	constructor(private readonly canvas: Canvas) {}

	onPointerDown(e: PointerEvent) {
		this.isDragging = true;

		const startingCamera = this.canvas.camera.clone();
		const startingX = e.clientX;
		const startingY = e.clientY;

		const pan = (e: PointerEvent) => {
			this.canvas.camera.x = startingCamera.x + e.clientX - startingX;
			this.canvas.camera.y = startingCamera.y + e.clientY - startingY;
		};

		this.canvas.canvas.addEventListener('pointermove', pan);
		this.canvas.canvas.addEventListener(
			'pointerup',
			(e: PointerEvent) => {
				this.isDragging = false;
				pan(e);
				this.canvas.canvas.removeEventListener('pointermove', pan);
			},
			{ once: true }
		);
	}
}

export class Canvas {
	private rafId: number = 0;
	private panTool: PanTool;
	camera: Camera = new Camera(0, 0, 1);

	constructor(
		readonly canvas: HTMLCanvasElement,
		readonly ctx: CanvasRenderingContext2D
	) {
		this.panTool = new PanTool(this);

		this.draw = this.draw.bind(this);
		this.onPointerDown = this.onPointerDown.bind(this);

		this.draw();
		canvas.addEventListener('pointerdown', this.onPointerDown);
	}

	cleanUp() {
		this.canvas.removeEventListener('pointerdown', this.onPointerDown);
		cancelAnimationFrame(this.rafId);
	}

	draw() {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;

		this.ctx.translate(this.camera.x, this.camera.y);

		this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

		// Set line width
		this.ctx.lineWidth = 10;

		// Wall
		this.ctx.strokeRect(75, 140, 150, 110);

		// Door
		this.ctx.fillRect(130, 190, 40, 60);

		// Roof
		this.ctx.beginPath();
		this.ctx.moveTo(50, 140);
		this.ctx.lineTo(150, 60);
		this.ctx.lineTo(250, 140);
		this.ctx.closePath();
		this.ctx.stroke();

		// Wall
		this.ctx.strokeRect(75, 640, 150, 110);

		// Door
		this.ctx.fillRect(130, 690, 40, 60);

		// Roof
		this.ctx.beginPath();
		this.ctx.moveTo(50, 640);
		this.ctx.lineTo(150, 560);
		this.ctx.lineTo(250, 640);
		this.ctx.closePath();
		this.ctx.stroke();

		this.rafId = requestAnimationFrame(this.draw);
	}

	onPointerDown(e: PointerEvent) {
		// const mode = this.mode
		//
		// switch(mode.){
		//   case'pan': {

		this.panTool.onPointerDown(e);

		//   }
		// default:
		//   console.log('default case of the onPointerDown')
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
