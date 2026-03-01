import { ipcMain } from 'electron';
import client from '../../shared/pat.api';
import { ChildProcess, spawn } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';

let patProcess: ChildProcess | null = null;
let lastCallSign: string | null = null;
let lastStartedAt: string | null = null;

const logPrefix = '[pat:start]';

function isPatRunning(): boolean {
	return patProcess !== null && patProcess.exitCode === null && !patProcess.killed;
}

function getPatStatus() {
	return {
		running: isPatRunning(),
		pid: patProcess?.pid ?? null,
		exitCode: patProcess?.exitCode ?? null,
		killed: patProcess?.killed ?? false,
		callSign: lastCallSign,
		startedAt: lastStartedAt
	};
}

function attachPatLogging(child: ChildProcess): void {
	child.stdout?.on('data', (chunk: Buffer) => {
		const output = chunk.toString().trim();
		if (output.length > 0) {
			console.log(`${logPrefix} stdout: ${output}`);
		}
	});

	child.stderr?.on('data', (chunk: Buffer) => {
		const output = chunk.toString().trim();
		if (output.length > 0) {
			console.error(`${logPrefix} stderr: ${output}`);
		}
	});

	child.on('spawn', () => {
		console.log(`${logPrefix} spawned pid=${child.pid ?? 'unknown'}`);
	});

	child.on('error', (error) => {
		console.error(`${logPrefix} child process error:`, error);
		patProcess = null;
	});

	child.on('exit', (code, signal) => {
		console.warn(`${logPrefix} exited code=${code ?? 'null'} signal=${signal ?? 'null'}`);
		patProcess = null;
	});
}

export function setupIPChandlers(appPath: string) {
	ipcMain.handle('pat:start', (_event, callSign: string) => {
		const normalizedCallSign = callSign.trim().toUpperCase();
		console.log(`${logPrefix} requested callsign=${normalizedCallSign} appPath=${appPath}`);

		if (!normalizedCallSign) {
			throw new Error('Callsign is required.');
		}

		if (isPatRunning()) {
			console.log(`${logPrefix} already running pid=${patProcess?.pid ?? 'unknown'}`);
			return;
		}

		const executablePath = join(appPath, 'bin', 'pat');
		if (!existsSync(executablePath)) {
			console.error(`${logPrefix} executable not found at ${executablePath}`);
			throw new Error(`pat executable not found at ${executablePath}`);
		}

		console.log(`${logPrefix} launching executable=${executablePath}`);
		const child = spawn(executablePath, ['--mycall', normalizedCallSign, 'http'], {
			cwd: appPath,
			detached: true,
			stdio: ['ignore', 'pipe', 'pipe']
		});

		patProcess = child;
		lastCallSign = normalizedCallSign;
		lastStartedAt = new Date().toISOString();
		attachPatLogging(child);

		// Allow pat to keep running independently from the Electron process.
		child.unref();
	});

	ipcMain.handle('pat:status', () => {
		const status = getPatStatus();
		console.log(`${logPrefix} status requested`, status);
		return status;
	});
	ipcMain.handle(
		'pat:getRmsList',
		(
			_event,
			params: {
				mode?: string;
				band?: string;
				forceDownload?: boolean;
				predict?: boolean;
			}
		) => {
			return client.getRMSList(params);
		}
	);

	ipcMain.handle('pat:getBandwidths', (_event, mode: string) => {
		return client.getBandwidths(mode);
	});

	ipcMain.handle('pat:getConnectAliases', () => {
		return client.getConnectAliases();
	});

	ipcMain.handle('pat:connectToStation', (_event, rawUrl: string) => {
		return client.connectToStation(rawUrl);
	});

	ipcMain.handle('pat:sendQsy', (_event, data: { transport: string; freq: number }) => {
		return client.sendQSY(data);
	});
}
