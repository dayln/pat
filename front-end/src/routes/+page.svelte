<script lang="ts">
	import { onMount } from 'svelte';
	import type { ConnectionAliases, PatStatus, RMSStation } from '../shared/pat.types';

	let aliases = $state<ConnectionAliases | null>(null);
	let aliasEntries = $state<[string, string][]>([]);
	let isLoading = $state(false);
	let isStarting = $state(false);
	let isStatusLoading = $state(false);
	let isRmsLoading = $state(false);
	let errorMessage = $state('');
	let startErrorMessage = $state('');
	let startSuccessMessage = $state('');
	let statusErrorMessage = $state('');
	let rmsErrorMessage = $state('');
	let callSign = $state('');
	let patStatus = $state<PatStatus | null>(null);
	let statusCheckedAt = $state('');
	let rmsList = $state<RMSStation[]>([]);
	let rmsMode = $state('');
	let rmsBand = $state('');
	let rmsForceDownload = $state(false);
	let rmsPredict = $state(false);

	const ipcHandle = async (): Promise<void> => {
		isLoading = true;
		errorMessage = '';

		try {
			aliases = await window.api.getConnectAliases();
			aliasEntries = Object.entries(aliases).sort(([a], [b]) => a.localeCompare(b));
		} catch (error) {
			aliases = null;
			aliasEntries = [];
			errorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.error('Failed to get connection aliases:', error);
		} finally {
			isLoading = false;
		}
	};

	const refreshStatus = async (): Promise<void> => {
		isStatusLoading = true;
		statusErrorMessage = '';
		try {
			patStatus = await window.api.getStatus();
			statusCheckedAt = new Date().toLocaleString();
			console.log('[pat:start] UI status refreshed', patStatus);
		} catch (error) {
			statusErrorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.error('[pat:start] UI status check failed', { error });
		} finally {
			isStatusLoading = false;
		}
	};

	const startCall = async (): Promise<void> => {
		const normalizedCallSign = callSign.trim().toUpperCase();
		startErrorMessage = '';
		startSuccessMessage = '';
		console.log('[pat:start] UI start requested', { callSign: normalizedCallSign });

		if (!normalizedCallSign) {
			startErrorMessage = 'Callsign is required.';
			return;
		}

		isStarting = true;
		try {
			await window.api.start(normalizedCallSign);
			console.log('[pat:start] UI start completed', { callSign: normalizedCallSign });
			await refreshStatus();
			startSuccessMessage = `Pat started for ${normalizedCallSign}.`;
			callSign = normalizedCallSign;
		} catch (error) {
			console.error('[pat:start] UI start failed', { callSign: normalizedCallSign, error });
			startErrorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.error('Failed to start call:', error);
		} finally {
			isStarting = false;
		}
	};

	const loadRmsList = async (): Promise<void> => {
		isRmsLoading = true;
		rmsErrorMessage = '';
		try {
			rmsList = await window.api.getRMSList({
				mode: rmsMode.trim() || undefined,
				band: rmsBand.trim() || undefined,
				forceDownload: rmsForceDownload || undefined,
				predict: rmsPredict || undefined
			});
			console.log('[pat:rms] UI rms list loaded', {
				count: rmsList.length,
				mode: rmsMode,
				band: rmsBand,
				forceDownload: rmsForceDownload,
				predict: rmsPredict
			});
		} catch (error) {
			rmsList = [];
			rmsErrorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.error('[pat:rms] UI rms list failed', {
				error,
				mode: rmsMode,
				band: rmsBand,
				forceDownload: rmsForceDownload,
				predict: rmsPredict
			});
		} finally {
			isRmsLoading = false;
		}
	};

	onMount(() => {
		void refreshStatus();
	});
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<section aria-label="Start call">
	<h2>Start Call</h2>
	<div class="flex items-end gap-3">
		<label class="flex flex-col gap-1" for="callsign">
			<span>Callsign</span>
			<input
				id="callsign"
				type="text"
				class="input"
				placeholder="e.g. K1ABC"
				bind:value={callSign}
				disabled={isStarting}
			/>
		</label>
		<button type="button" class="btn preset-filled" onclick={startCall} disabled={isStarting}>
			{isStarting ? 'Starting...' : 'Start Call'}
		</button>
	</div>
	{#if startErrorMessage}
		<p role="status">Failed to start: {startErrorMessage}</p>
	{:else if startSuccessMessage}
		<p role="status">{startSuccessMessage}</p>
	{/if}
</section>

<section aria-label="Pat process status">
	<h2>Pat Process Status</h2>
	<button type="button" class="btn preset-filled" onclick={refreshStatus} disabled={isStatusLoading}>
		{isStatusLoading ? 'Checking status...' : 'Refresh Status'}
	</button>
	{#if statusErrorMessage}
		<p role="status">Failed to check status: {statusErrorMessage}</p>
	{:else if patStatus}
		<p role="status">
			Running: <strong>{patStatus.running ? 'Yes' : 'No'}</strong>
			| PID: <code>{patStatus.pid ?? 'N/A'}</code>
			| Call: <code>{patStatus.callSign ?? 'N/A'}</code>
		</p>
		<p role="status">
			Exit Code: <code>{patStatus.exitCode ?? 'N/A'}</code>
			| Killed: <code>{patStatus.killed ? 'true' : 'false'}</code>
			| Started: <code>{patStatus.startedAt ?? 'N/A'}</code>
		</p>
		{#if statusCheckedAt}
			<p role="status">Last checked: {statusCheckedAt}</p>
		{/if}
	{/if}
</section>

<button type="button" class="btn preset-filled" onclick={ipcHandle} disabled={isLoading}>
	{isLoading ? 'Loading aliases...' : 'Get Connection Aliases'}
</button>

{#if errorMessage}
	<p role="status">Failed to load aliases: {errorMessage}</p>
{:else if aliases && aliasEntries.length === 0}
	<p role="status">No connection aliases configured.</p>
{:else if aliasEntries.length > 0}
	<section aria-label="Connection aliases">
		<h2>Connection Aliases ({aliasEntries.length})</h2>
		<ul>
			{#each aliasEntries as [name, target] (name)}
				<li>
					<strong>{name}</strong>: <code>{target}</code>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<section aria-label="RMS list">
	<h2>RMS List</h2>
	<div class="grid gap-2 md:grid-cols-4">
		<label class="flex flex-col gap-1" for="rms-mode">
			<span>Mode</span>
			<input id="rms-mode" class="input" type="text" placeholder="e.g. ardop" bind:value={rmsMode} />
		</label>
		<label class="flex flex-col gap-1" for="rms-band">
			<span>Band</span>
			<input id="rms-band" class="input" type="text" placeholder="e.g. 40m" bind:value={rmsBand} />
		</label>
		<label class="flex items-center gap-2" for="rms-force-download">
			<input id="rms-force-download" type="checkbox" bind:checked={rmsForceDownload} />
			<span>Force Download</span>
		</label>
		<label class="flex items-center gap-2" for="rms-predict">
			<input id="rms-predict" type="checkbox" bind:checked={rmsPredict} />
			<span>Predict</span>
		</label>
	</div>

	<div class="mt-3">
		<button type="button" class="btn preset-filled" onclick={loadRmsList} disabled={isRmsLoading}>
			{isRmsLoading ? 'Loading RMS...' : 'Get RMS List'}
		</button>
	</div>

	{#if rmsErrorMessage}
		<p role="status">Failed to load RMS list: {rmsErrorMessage}</p>
	{:else if !isRmsLoading && rmsList.length === 0}
		<p role="status">No RMS stations loaded yet.</p>
	{:else if rmsList.length > 0}
		<div class="mt-3 overflow-x-auto">
			<table>
				<thead>
					<tr>
						<th>Callsign</th>
						<th>Distance</th>
						<th>Mode(s)</th>
						<th>Frequency</th>
						<th>Quality</th>
						<th>URL</th>
					</tr>
				</thead>
				<tbody>
					{#each rmsList as station (station.url)}
						<tr>
							<td><strong>{station.callsign}</strong></td>
							<td>{station.distance}</td>
							<td><code>{station.modes}</code></td>
							<td>{station.dial?.freq ?? 'N/A'}</td>
							<td>{station.link_quality}</td>
							<td><code>{station.url}</code></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>
