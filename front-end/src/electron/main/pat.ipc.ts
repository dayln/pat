import { ipcMain } from 'electron';
import client from '../../shared/pat.api';
import { spawn } from 'child_process';
import { join } from 'path';

export function setupIPChandlers(appPath: string) {
	ipcMain.handle('pat:start', (_event, callSign: string) => {
		const executablePath = join(appPath, 'bin', 'pat');
		spawn(executablePath, ['--mycall', callSign, 'http'], {
			cwd: appPath,
			stdio: 'pipe'
		});
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
