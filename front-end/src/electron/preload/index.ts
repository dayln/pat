import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

const api = {
	start: (callSign: string) => ipcRenderer.invoke('pat:start', callSign),
	getRMSList: (params: {
		mode?: string;
		band?: string;
		forceDownload?: boolean;
		predict?: boolean;
	}) => ipcRenderer.invoke('pat:getRmsList', params),
	getBandwidths: (mode: string) => ipcRenderer.invoke('pat:getBandwidths', mode),
	getConnectAliases: () => ipcRenderer.invoke('pat:getConnectAliases'),
	getStatus: () => ipcRenderer.invoke('pat:status'),
	connectToStation: (rawUrl: string) => ipcRenderer.invoke('pat:connectToStation', rawUrl),
	sendQsy: (data: { transport: string; freq: number }) => ipcRenderer.invoke('pat:sendQsy', data)
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
	try {
		contextBridge.exposeInMainWorld('electron', electronAPI);
		contextBridge.exposeInMainWorld('api', api);
	} catch (error) {
		console.error(error);
	}
} else {
	// @ts-expect-error (define in dts)
	window.electron = electronAPI;
	// @ts-expect-error (define in dts)
	window.api = api;
}
