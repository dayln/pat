<script lang="ts">
	import { onMount } from 'svelte';
	import pat from '../shared/pat.api';
	import type { ConnectionAliases, PatStatus, RMSStation } from '../shared/pat.types';

	let aliases = $state<ConnectionAliases | null>(null);
	let aliasEntries = $state<[string, string][]>([]);
	let isLoading = $state(false);
	let isStatusLoading = $state(false);
	let isRmsLoading = $state(false);
	let errorMessage = $state('');
	let statusErrorMessage = $state('');
	let rmsErrorMessage = $state('');
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
			aliases = await pat.getConnectAliases();
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
			patStatus = await pat.getStatus();
			statusCheckedAt = new Date().toLocaleString();
			console.log('[pat:process] UI status refreshed', patStatus);
		} catch (error) {
			statusErrorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.error('[pat:process] UI status check failed', { error });
		} finally {
			isStatusLoading = false;
		}
	};

	const loadRmsList = async (): Promise<void> => {
		isRmsLoading = true;
		rmsErrorMessage = '';
		try {
			rmsList = await pat.getRMSList({
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

<main class="page">
	<header class="page-header">
		<h1>Pat Control Panel</h1>
		<p>Pat starts with the app; check process status, inspect aliases, and query RMS stations.</p>
	</header>

	<section class="panel" aria-label="Pat process status">
		<div class="section-header">
			<h2>Pat Status</h2>
			<button type="button" class="primary-button" onclick={refreshStatus} disabled={isStatusLoading}>
				{isStatusLoading ? 'Checking status...' : 'Refresh Status'}
			</button>
		</div>
		{#if statusErrorMessage}
			<p class="message error" role="status">Failed to check status: {statusErrorMessage}</p>
		{:else if patStatus}
			<dl class="status-grid">
				<div>
					<dt>Connected</dt>
					<dd>{patStatus.connected ? 'Yes' : 'No'}</dd>
				</div>
				<div>
					<dt>Dialing</dt>
					<dd>{patStatus.dialing ? 'Yes' : 'No'}</dd>
				</div>
				<div>
					<dt>Remote Address</dt>
					<dd><code>{patStatus.remote_addr || 'N/A'}</code></dd>
				</div>
				<div>
					<dt>Active Listeners</dt>
					<dd><code>{patStatus.active_listeners.join(', ') || 'None'}</code></dd>
				</div>
				<div>
					<dt>HTTP Clients</dt>
					<dd><code>{patStatus.http_clients.length}</code></dd>
				</div>
				<div>
					<dt>Config Hash</dt>
					<dd>
						<code class="truncated-hash" title={patStatus.config_hash || undefined}>
							{patStatus.config_hash || 'N/A'}
						</code>
					</dd>
				</div>
			</dl>
			{#if statusCheckedAt}
				<p class="message neutral" role="status">Last checked: {statusCheckedAt}</p>
			{/if}
		{/if}
	</section>

	<section class="panel" aria-label="Connection aliases">
		<div class="section-header">
			<h2>Connection Aliases</h2>
			<button type="button" class="primary-button" onclick={ipcHandle} disabled={isLoading}>
				{isLoading ? 'Loading aliases...' : 'Load Aliases'}
			</button>
		</div>

		{#if errorMessage}
			<p class="message error" role="status">Failed to load aliases: {errorMessage}</p>
		{:else if aliases && aliasEntries.length === 0}
			<p class="message neutral" role="status">No connection aliases configured.</p>
		{:else if aliasEntries.length > 0}
			<ul class="alias-list">
				{#each aliasEntries as [name, target] (name)}
					<li>
						<strong>{name}</strong>
						<code>{target}</code>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="message neutral" role="status">Aliases are not loaded yet.</p>
		{/if}
	</section>

	<section class="panel" aria-label="RMS list">
		<div class="section-header">
			<h2>RMS List</h2>
		</div>

		<div class="rms-controls">
			<label class="field" for="rms-mode">
				<span>Mode</span>
				<input id="rms-mode" type="text" placeholder="e.g. ardop" bind:value={rmsMode} />
			</label>
			<label class="field" for="rms-band">
				<span>Band</span>
				<input id="rms-band" type="text" placeholder="e.g. 40m" bind:value={rmsBand} />
			</label>
			<label class="toggle" for="rms-force-download">
				<input id="rms-force-download" type="checkbox" bind:checked={rmsForceDownload} />
				<span>Force Download</span>
			</label>
			<label class="toggle" for="rms-predict">
				<input id="rms-predict" type="checkbox" bind:checked={rmsPredict} />
				<span>Predict</span>
			</label>
		</div>

		<div class="actions">
			<button type="button" class="primary-button" onclick={loadRmsList} disabled={isRmsLoading}>
				{isRmsLoading ? 'Loading RMS...' : 'Get RMS List'}
			</button>
		</div>

		{#if rmsErrorMessage}
			<p class="message error" role="status">Failed to load RMS list: {rmsErrorMessage}</p>
		{:else if !isRmsLoading && rmsList.length === 0}
			<p class="message neutral" role="status">No RMS stations loaded yet.</p>
		{:else if rmsList.length > 0}
			<div class="table-wrap">
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
</main>

<style>
	:global(body) {
		margin: 0;
		background: linear-gradient(180deg, #f4f6f8 0%, #edf1f5 100%);
		font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif;
		color: #132034;
	}

	.page {
		max-width: 1050px;
		margin: 0 auto;
		padding: 2rem 1rem 3rem;
		display: grid;
		gap: 1rem;
	}

	.page-header h1 {
		margin: 0;
		font-size: 1.9rem;
	}

	.page-header p {
		margin: 0.35rem 0 0;
		color: #465971;
	}

	.panel {
		background: #ffffff;
		border: 1px solid #d9e1ea;
		border-radius: 12px;
		padding: 1rem;
		box-shadow: 0 8px 24px rgba(18, 33, 56, 0.06);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		align-items: center;
		flex-wrap: wrap;
		margin-bottom: 0.75rem;
	}

	.section-header h2 {
		margin: 0;
		font-size: 1.1rem;
	}

	.field {
		display: grid;
		gap: 0.35rem;
		flex: 1 1 220px;
	}

	.field span {
		font-size: 0.9rem;
		color: #3c5069;
	}

	input[type='text'] {
		width: 100%;
		border: 1px solid #c8d3e1;
		border-radius: 10px;
		padding: 0.55rem 0.7rem;
		background: #fbfcfe;
		font: inherit;
		color: inherit;
	}

	input[type='text']:focus {
		outline: 2px solid #3b82f6;
		outline-offset: 1px;
	}

	.primary-button {
		border: 0;
		border-radius: 10px;
		padding: 0.6rem 0.9rem;
		font: inherit;
		font-weight: 600;
		background: #175cd3;
		color: #ffffff;
		cursor: pointer;
	}

	.primary-button:hover:enabled {
		background: #124aa9;
	}

	.primary-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.message {
		margin: 0.75rem 0 0;
		padding: 0.55rem 0.7rem;
		border-radius: 8px;
		font-size: 0.95rem;
	}

	.message.error {
		background: #fff1f2;
		color: #9f1239;
	}

	.message.neutral {
		background: #f3f6fa;
		color: #334155;
	}

	.status-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
		gap: 0.6rem;
		margin: 0;
	}

	.status-grid div {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 0.5rem 0.65rem;
	}

	.status-grid dt {
		margin: 0;
		color: #475569;
		font-size: 0.8rem;
	}

	.status-grid dd {
		margin: 0.25rem 0 0;
		font-weight: 600;
	}

	code {
		font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.88em;
		background: #f2f7ff;
		border: 1px solid #d8e5fb;
		border-radius: 6px;
		padding: 0.1rem 0.3rem;
	}

	.truncated-hash {
		display: inline-block;
		max-width: 16ch;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		vertical-align: bottom;
	}

	.alias-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.45rem;
	}

	.alias-list li {
		padding: 0.5rem 0.65rem;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		display: flex;
		gap: 0.6rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.rms-controls {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
		gap: 0.65rem;
		align-items: end;
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.55rem 0.65rem;
		border: 1px solid #d6dde8;
		border-radius: 8px;
		background: #fbfcff;
	}

	.toggle input {
		margin: 0;
	}

	.actions {
		margin-top: 0.75rem;
	}

	.table-wrap {
		margin-top: 0.75rem;
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.92rem;
	}

	th,
	td {
		text-align: left;
		padding: 0.55rem 0.6rem;
		border-bottom: 1px solid #e2e8f0;
		vertical-align: top;
	}

	thead th {
		background: #f8fafc;
		color: #475569;
		font-weight: 600;
		position: sticky;
		top: 0;
	}

	@media (max-width: 640px) {
		.page {
			padding: 1rem 0.75rem 2rem;
		}
	}
</style>
