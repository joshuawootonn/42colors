<script lang="ts">

	function randomHex() {
		return (Math.random() * 1000000000000).toString(16).slice(0, 6);
	}

	const colors = Array.from({ length: 15000 }, () => `#ffffff`);
	const initialColorOptions = Array.from({ length: 10 }, randomHex);
</script>

<div class="flex fixed">
	<h1 class="text-2xl font-bold">welcome to one million color inputs</h1>
	{#each initialColorOptions as color}
		<input type="color" class="aspect-square w-4 h-4 border-0 border-red-700" value={color} />
	{/each}
</div>

<div class="grid grid-col-6 bg-gray-200 p-0.5 gap-0.5 divide-solid">
	{#each colors as color}
		<input type="color" class="aspect-square size-4 border-0 border-red-700" value={color} />
	{/each}
</div>

<style>
	.grid {
		grid-template-columns: repeat(auto-fill, minmax(16px, 1fr));
	}

	::-webkit-color-swatch-wrapper {
		padding: 0px;
	}
	::-webkit-color-swatch {
		border-width: 0px;
		border-right: 0px;
		border-bottom: 0px;
	}
</style>
