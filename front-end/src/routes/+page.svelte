<script lang="ts">
	const ipcHandle = (): void => window.electron.ipcRenderer.send('ping');
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
<button onclick={ipcHandle}>Send IPC Ping</button>
