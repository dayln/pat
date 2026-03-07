import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import type {
	CoordsToLocatorPayload,
	DisconnectParams,
	PositionReportPayload,
	QsyPayload,
	PatConfig
} from '../../shared/pat.types';

const api = {
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
	sendQsy: (data: QsyPayload) => ipcRenderer.invoke('pat:sendQsy', data),
	disconnect: (params?: DisconnectParams) => ipcRenderer.invoke('pat:disconnect', params),
	getCurrentGpsPosition: () => ipcRenderer.invoke('pat:getCurrentGpsPosition'),
	coordsToLocator: (data: CoordsToLocatorPayload) =>
		ipcRenderer.invoke('pat:coordsToLocator', data),
	postPositionReport: (data: PositionReportPayload) =>
		ipcRenderer.invoke('pat:postPositionReport', data),
	getConfig: () => ipcRenderer.invoke('pat:getConfig'),
	updateConfig: (config: PatConfig) => ipcRenderer.invoke('pat:updateConfig', config),
	getAlias: (alias: string) => ipcRenderer.invoke('pat:getAlias', alias),
	setAlias: (alias: string, value: string) => ipcRenderer.invoke('pat:setAlias', alias, value),
	deleteAlias: (alias: string) => ipcRenderer.invoke('pat:deleteAlias', alias),
	reload: () => ipcRenderer.invoke('pat:reload')
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
