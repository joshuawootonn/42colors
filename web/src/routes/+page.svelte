<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	function randomHex() {
		return '#' + (Math.random() * 1000000000000).toString(16).slice(0, 6);
	}

	// const colors = Array.from({ length: 15000 }, () => `#ffffff`);
	const initialColorOptions = Array.from({ length: 32 }, randomHex);

	class Canvas {
		private isDragging = false;
		private ctx: CanvasRenderingContext2D;
		private rafId: number = 0;

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
</script>

<div class="flex fixed">
	<h1 class="text-2xl font-bold">welcome to one million color inputs</h1>
	{#each initialColorOptions as color}
		<input type="color" class="aspect-square w-4 h-4 border-0 border-red-700" value={color} />
	{/each}
</div>

<canvas id="my-house" height="100vh" width="100vw" />
