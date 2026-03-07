import { ipcMain } from 'electron';
import client from '../../shared/pat.api';
import { ChildProcess, spawn } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';
import type {
	CoordsToLocatorPayload,
	DisconnectParams,
	PositionReportPayload,
	QsyPayload,
	PatConfig,
	MailboxBox,
	AttachmentRequestOptions,
	OutboundMessagePayload
} from '../../shared/pat.types';

let patProcess: ChildProcess | null = null;

const logPrefix = '[pat:process]';

function isPatRunning(): boolean {
	return patProcess !== null && patProcess.exitCode === null && !patProcess.killed;
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

export function startPatProcess(appPath: string): void {
	if (isPatRunning()) {
		console.log(`${logPrefix} already running pid=${patProcess?.pid ?? 'unknown'}`);
		return;
	}

	const bundledPatPath = join(appPath, 'bin', 'pat');
	const executable = existsSync(bundledPatPath) ? bundledPatPath : 'pat';
	console.log(`${logPrefix} launching executable=${executable} command=http`);
	const child = spawn(executable, ['http'], {
		cwd: appPath,
		stdio: ['ignore', 'pipe', 'pipe']
	});

	patProcess = child;
	attachPatLogging(child);
}

export function stopPatProcess(reason: string): void {
	if (!isPatRunning() || !patProcess) {
		return;
	}

	const child = patProcess;
	console.log(`${logPrefix} stopping pid=${child.pid ?? 'unknown'} reason=${reason}`);

	try {
		child.kill('SIGTERM');
	} catch (error) {
		console.error(`${logPrefix} failed to send SIGTERM:`, error);
	}
}

export function setupIPChandlers() {
	ipcMain.handle('pat:status', async () => {
		const status = await client.getStatus();
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

	ipcMain.handle('pat:sendQsy', (_event, data: QsyPayload) => {
		return client.sendQSY(data);
	});

	ipcMain.handle('pat:disconnect', (_event, params?: DisconnectParams) => {
		return client.disconnect(params);
	});

	ipcMain.handle('pat:getCurrentGpsPosition', () => {
		return client.getCurrentGpsPosition();
	});

	ipcMain.handle('pat:coordsToLocator', (_event, data: CoordsToLocatorPayload) => {
		return client.coordsToLocator(data);
	});

	ipcMain.handle('pat:postPositionReport', (_event, data: PositionReportPayload) => {
		return client.postPositionReport(data);
	});

	ipcMain.handle('pat:getConfig', () => {
		return client.getConfig();
	});

	ipcMain.handle('pat:updateConfig', (_event, config: PatConfig) => {
		return client.updateConfig(config);
	});

	ipcMain.handle('pat:getAlias', (_event, alias: string) => {
		return client.getAlias(alias);
	});

	ipcMain.handle('pat:setAlias', (_event, alias: string, value: string) => {
		return client.setAlias(alias, value);
	});

	ipcMain.handle('pat:deleteAlias', (_event, alias: string) => {
		return client.deleteAlias(alias);
	});

	ipcMain.handle('pat:reload', () => {
		return client.reload();
	});

	ipcMain.handle('pat:getMailbox', (_event, box: MailboxBox) => {
		return client.getMailbox(box);
	});

	ipcMain.handle('pat:getMessage', (_event, box: MailboxBox, mid: string) => {
		return client.getMessage(box, mid);
	});

	ipcMain.handle('pat:deleteMessage', (_event, box: MailboxBox, mid: string) => {
		return client.deleteMessage(box, mid);
	});

	ipcMain.handle(
		'pat:getAttachment',
		(
			_event,
			box: MailboxBox,
			mid: string,
			attachment: string,
			options?: AttachmentRequestOptions
		) => {
			return client.getAttachment(box, mid, attachment, options);
		}
	);

	ipcMain.handle(
		'pat:getAttachmentText',
		(
			_event,
			box: MailboxBox,
			mid: string,
			attachment: string,
			options?: AttachmentRequestOptions
		) => {
			return client.getAttachmentText(box, mid, attachment, options);
		}
	);

	ipcMain.handle('pat:setMailboxRead', (_event, box: MailboxBox, mid: string, read: boolean) => {
		return client.setMailboxRead(box, mid, read);
	});

	ipcMain.handle('pat:moveMessage', (_event, box: MailboxBox, mid: string) => {
		return client.moveMessage(box, mid);
	});

	ipcMain.handle('pat:postOutboundMessage', (_event, payload: OutboundMessagePayload) => {
		return client.postOutboundMessage(payload);
	});
}
