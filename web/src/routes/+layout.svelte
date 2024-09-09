<script lang="ts">
	import '../app.css';

	import { navigating } from '$app/stores';
	import { PUBLIC_FATHOM_ID, PUBLIC_FATHOM_URL } from '$env/static/public';
	import * as Fathom from 'fathom-client';
	import { onMount } from 'svelte';

	onMount(async () => {
		Fathom.load(PUBLIC_FATHOM_ID, {
			url: PUBLIC_FATHOM_URL
		});
	});

	$: if ($navigating) Fathom.trackPageview();
</script>

<slot />
