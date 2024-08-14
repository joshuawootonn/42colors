<script lang="ts">
	import { onMount } from 'svelte';
	import Toolbar from './toolbar.svelte';
	import { Canvas, type Mode } from '$lib/canvas.svelte';
	import { PUBLIC_API_ORIGIN } from '$env/static/public';

	let htmlCanvas: HTMLCanvasElement | null = null;

	let context: CanvasRenderingContext2D | null = null;

	let canvas: Canvas | null = null;

	onMount(() => {
		const element = document.getElementById('my-house');
		if (element instanceof HTMLCanvasElement) {
			context = element.getContext('2d');
			htmlCanvas = element;
		}
	});

	function randomHex() {
		return '#' + (Math.random() * 1000000000000).toString(16).slice(0, 6);
	}

	const initialColorOptions = Array.from({ length: 32 }, randomHex);

	onMount(() => {
		const element = document.getElementById('my-house');
		if (element instanceof HTMLCanvasElement) {
			const context = element.getContext('2d');
			if (context == null) {
				// todo(Josh): create a state for this
				throw new Error('Failed to initialize the Canvas');
			}

			canvas = new Canvas(element, context, PUBLIC_API_ORIGIN);
			canvas.fetchPixels();
		}
	});

	function setMode(mode: Mode) {
		canvas?.setMode(mode);
	}
</script>

<div class="flex fixed">
	<h1 class="text-2xl font-bold">welcome to settlers of roy g biv</h1>
	<!-- {#each initialColorOptions as color} -->
	<!-- 	<input type="color" class="aspect-square w-4 h-4 border-0 border-red-700" value={color} /> -->
	<!-- {/each} -->

	{#if canvas != null}
		<Toolbar mode={canvas.mode} {setMode} />
	{/if}
</div>

<canvas id="my-house" height="100vh" width="100vw"></canvas>
