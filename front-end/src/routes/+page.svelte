<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	const ipcHandle = (): void => window.electron.ipcRenderer.send('ping');
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
<Button onclick={ipcHandle}>Send IPC Ping</Button>
