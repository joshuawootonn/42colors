<script lang="ts">
	import { onMount } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import Toolbar from './toolbar.svelte';
	import { Canvas, State, type Mode, type Store } from '$lib';

	let htmlCanvas: HTMLCanvasElement | null = null;

	let context: CanvasRenderingContext2D | null = null;

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

	const store: Writable<Store> = writable<Store>({ state: State.Initializing });

	onMount(() => {
		const element = document.getElementById('my-house');
		if (element instanceof HTMLCanvasElement) {
			const context = element.getContext('2d');
			if (context == null) {
				// todo(Josh): create a state for this
				throw new Error('Failed to initialize the Canvas');
			}

			const canvas = new Canvas(element, context);
			store.set({ state: State.Working, canvas: element, context, mode: 'pan' });
		}
	});

	function setMode(mode: Mode) {
		store.update((s) => ({ ...s, mode }));
	}
</script>

<div class="flex fixed">
	<h1 class="text-2xl font-bold">welcome to settlers of roy g biv</h1>
	{#each initialColorOptions as color}
		<input type="color" class="aspect-square w-4 h-4 border-0 border-red-700" value={color} />
	{/each}

	{#if $store.state === State.Working}
		<Toolbar mode={$store.mode} {setMode} />
	{/if}
</div>

<canvas id="my-house" height="100vh" width="100vw" />
