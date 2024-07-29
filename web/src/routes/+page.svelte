<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { writable, type Subscriber, type Writable } from 'svelte/store';

	function randomHex() {
		return '#' + (Math.random() * 1000000000000).toString(16).slice(0, 6);
	}

	// const colors = Array.from({ length: 15000 }, () => `#ffffff`);
	const initialColorOptions = Array.from({ length: 32 }, randomHex);

	type Mode = 'pencil' | 'pan';

	class Canvas {
		private isDragging = false;
		private ctx: CanvasRenderingContext2D;
		private rafId: number = 0;
		mode: Writable<Mode> = writable<Mode>('pan');

		constructor(private readonly canvas: HTMLCanvasElement) {
			const context = canvas.getContext('2d');

			if (context == null) {
				throw new Error('Failed to initialize the Canvas');
			}
			this.ctx = context;

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

			this.ctx.translate(camera.x, camera.y);

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
			this.isDragging = true;

			const startingCamera = camera.clone();
			const startingX = e.clientX;
			const startingY = e.clientY;

			function pan(e: PointerEvent) {
				camera.x = startingCamera.x + e.clientX - startingX;
				camera.y = startingCamera.y + e.clientY - startingY;
			}

			this.canvas.addEventListener('pointermove', pan);
			this.canvas.addEventListener(
				'pointerup',
				(e: PointerEvent) => {
					this.isDragging = false;
					pan(e);
					this.canvas.removeEventListener('pointermove', pan);
				},
				{ once: true }
			);
		}

		changeMode(mode: Mode) {
			console.log(mode);
			this.mode.set(mode);
		}

		subscribeToMode(run: Subscriber<Mode>) {
			return this.mode.subscribe(run);
		}
	}

	class Camera {
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
	const camera = new Camera(100, 1000, 1);
	let canvas: Canvas | null = null;

	onMount(() => {
		const element = document.getElementById('my-house');
		if (element instanceof HTMLCanvasElement) {
			canvas = new Canvas(element);
		}
	});

	onDestroy(() => {
		canvas?.cleanUp();
	});

	$: myMode = canvas?.mode;
</script>

<div class="flex fixed">
	<h1 class="text-2xl font-bold">welcome to one million color inputs</h1>
	{#each initialColorOptions as color}
		<input type="color" class="aspect-square w-4 h-4 border-0 border-red-700" value={color} />
	{/each}

	<div>{$myMode}</div>
	<button on:click={() => canvas?.changeMode('pan')}>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="size-6"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M10.05 4.575a1.575 1.575 0 1 0-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 0 1 3.15 0v1.5m-3.15 0 .075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 0 1 3.15 0V15M6.9 7.575a1.575 1.575 0 1 0-3.15 0v8.175a6.75 6.75 0 0 0 6.75 6.75h2.018a5.25 5.25 0 0 0 3.712-1.538l1.732-1.732a5.25 5.25 0 0 0 1.538-3.712l.003-2.024a.668.668 0 0 1 .198-.471 1.575 1.575 0 1 0-2.228-2.228 3.818 3.818 0 0 0-1.12 2.687M6.9 7.575V12m6.27 4.318A4.49 4.49 0 0 1 16.35 15m.002 0h-.002"
			/>
		</svg>
	</button>

	<button on:click={() => canvas?.changeMode('pencil')}>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="size-6"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
			/>
		</svg>
	</button>
</div>

<canvas id="my-house" height="100vh" width="100vw" />
