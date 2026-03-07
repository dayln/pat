import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import type {
	CoordsToLocatorPayload,
	DisconnectParams,
	PositionReportPayload,
	QsyPayload,
	PatConfig,
	MailboxBox,
	AttachmentRequestOptions,
	OutboundMessagePayload,
	TemplateQueryOptions,
	FormSubmissionPayload
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
	reload: () => ipcRenderer.invoke('pat:reload'),
	getMailbox: (box: MailboxBox) => ipcRenderer.invoke('pat:getMailbox', box),
	getMessage: (box: MailboxBox, mid: string) => ipcRenderer.invoke('pat:getMessage', box, mid),
	deleteMessage: (box: MailboxBox, mid: string) =>
		ipcRenderer.invoke('pat:deleteMessage', box, mid),
	getAttachment: (
		box: MailboxBox,
		mid: string,
		attachment: string,
		options?: AttachmentRequestOptions
	) => ipcRenderer.invoke('pat:getAttachment', box, mid, attachment, options),
	getAttachmentText: (
		box: MailboxBox,
		mid: string,
		attachment: string,
		options?: AttachmentRequestOptions
	) => ipcRenderer.invoke('pat:getAttachmentText', box, mid, attachment, options),
	setMailboxRead: (box: MailboxBox, mid: string, read: boolean) =>
		ipcRenderer.invoke('pat:setMailboxRead', box, mid, read),
	moveMessage: (box: MailboxBox, mid: string) => ipcRenderer.invoke('pat:moveMessage', box, mid),
	postOutboundMessage: (payload: OutboundMessagePayload) =>
		ipcRenderer.invoke('pat:postOutboundMessage', payload),
	getFormsCatalog: () => ipcRenderer.invoke('pat:getFormsCatalog'),
	updateForms: () => ipcRenderer.invoke('pat:updateForms'),
	getTemplate: (options: TemplateQueryOptions) => ipcRenderer.invoke('pat:getTemplate', options),
	getFormData: () => ipcRenderer.invoke('pat:getFormData'),
	postFormData: (payload: FormSubmissionPayload) => ipcRenderer.invoke('pat:postFormData', payload),
	getFormTemplate: (options: TemplateQueryOptions) =>
		ipcRenderer.invoke('pat:getFormTemplate', options),
	getFormAsset: (path: string, responseType?: 'text' | 'arraybuffer') =>
		ipcRenderer.invoke('pat:getFormAsset', path, responseType)
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
