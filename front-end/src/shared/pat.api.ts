import type {
	PatClient,
	RMSStation,
	Bandwidths,
	ConnectionAliases,
	ConnectResult,
	PatStatus,
	QsyPayload,
	DisconnectParams,
	GpsPosition,
	CoordsToLocatorPayload,
	CoordsToLocatorResponse,
	PositionReportPayload,
	PatConfig,
	MailboxBox,
	MessageSummary,
	MessageDetail,
	AttachmentRequestOptions,
	OutboundMessagePayload,
	FormFolder,
	FormsUpdateResponse,
	TemplateQueryOptions,
	FormMessage,
	FormSubmissionPayload
} from './pat.types';
import { httpClient } from './httpClient';

interface WindowWithAPI extends Window {
	api?: PatClient;
}

const isRenderer = typeof window !== 'undefined';
const rendererGlobal = (isRenderer ? window : undefined) as WindowWithAPI | undefined;
const isElectronRenderer = isRenderer && Boolean(rendererGlobal?.api);

async function getRMSList(params: {
	mode?: string;
	band?: string;
	forceDownload?: boolean;
	predict?: boolean;
}) {
	const rmslistParams = {
		mode: params.mode,
		band: params.band,
		predict: params.predict,
		'force-download': params.forceDownload
	};
	const resp = await httpClient.get<RMSStation[]>('/api/rmslist', { params: rmslistParams });
	return resp.data;
}

async function getBandwidths(mode: string) {
	const resp = await httpClient.get<Bandwidths>('/api/bandwidths', { params: { mode } });
	return resp.data;
}

async function getConnectAliases() {
	const resp = await httpClient.get<ConnectionAliases>('/api/connect_aliases');
	return resp.data;
}

async function getStatus(): Promise<PatStatus> {
	const resp = await httpClient.get<PatStatus>('/api/status');
	return resp.data;
}

async function connectToStation(rawUrl: string): Promise<ConnectResult> {
	const resp = await httpClient.get<ConnectResult>('/api/connect', { params: { url: rawUrl } });
	return resp.data;
}

async function sendQSY(data: QsyPayload): Promise<void> {
	await httpClient.post('/api/qsy', data);
}

async function disconnect(params?: DisconnectParams): Promise<void> {
	const queryParams = params?.dirty === undefined ? undefined : { dirty: params.dirty };
	await httpClient.post('/api/disconnect', undefined, { params: queryParams });
}

async function getCurrentGpsPosition(): Promise<GpsPosition> {
	const resp = await httpClient.get<GpsPosition>('/api/current_gps_position');
	return resp.data;
}

async function coordsToLocator(data: CoordsToLocatorPayload): Promise<CoordsToLocatorResponse> {
	const resp = await httpClient.post<CoordsToLocatorResponse>('/api/coords_to_locator', data);
	return resp.data;
}

async function postPositionReport(data: PositionReportPayload): Promise<string> {
	const resp = await httpClient.post<string>('/api/posreport', data, {
		responseType: 'text'
	});
	return resp.data;
}

async function getConfig(): Promise<PatConfig> {
	const resp = await httpClient.get<PatConfig>('/api/config');
	return resp.data;
}

async function updateConfig(config: PatConfig): Promise<void> {
	await httpClient.put('/api/config', config);
}

async function getAlias(alias: string): Promise<string> {
	const resp = await httpClient.get<string>(
		`/api/config/connect_aliases/${encodeURIComponent(alias)}`
	);
	return resp.data;
}

async function setAlias(alias: string, value: string): Promise<string> {
	const resp = await httpClient.put<string>(
		`/api/config/connect_aliases/${encodeURIComponent(alias)}`,
		value
	);
	return resp.data;
}

async function deleteAlias(alias: string): Promise<void> {
	await httpClient.delete(`/api/config/connect_aliases/${encodeURIComponent(alias)}`);
}

async function reload(): Promise<void> {
	await httpClient.post('/api/reload');
}

async function getMailbox(box: MailboxBox): Promise<MessageSummary[]> {
	const resp = await httpClient.get<MessageSummary[]>(`/api/mailbox/${box}`);
	return resp.data;
}

async function getMessage(box: MailboxBox, mid: string): Promise<MessageDetail> {
	const resp = await httpClient.get<MessageDetail>(`/api/mailbox/${box}/${mid}`);
	return resp.data;
}

async function deleteMessage(box: MailboxBox, mid: string): Promise<void> {
	await httpClient.delete(`/api/mailbox/${box}/${mid}`);
}

async function getAttachment(
	box: MailboxBox,
	mid: string,
	attachment: string,
	options?: AttachmentRequestOptions
): Promise<ArrayBuffer> {
	const params: Record<string, string | boolean | undefined> = {};
	if (options?.inReplyTo) params['in-reply-to'] = options.inReplyTo;
	if (options?.renderToHtml) params.rendertohtml = options.renderToHtml;

	const resp = await httpClient.get(
		`/api/mailbox/${box}/${mid}/${encodeURIComponent(attachment)}`,
		{
			params,
			responseType: 'arraybuffer'
		}
	);
	return resp.data;
}

async function getAttachmentText(
	box: MailboxBox,
	mid: string,
	attachment: string,
	options?: AttachmentRequestOptions
): Promise<string> {
	const params: Record<string, string | boolean | undefined> = {};
	if (options?.inReplyTo) params['in-reply-to'] = options.inReplyTo;
	if (options?.renderToHtml) params.rendertohtml = options.renderToHtml;

	const resp = await httpClient.get(
		`/api/mailbox/${box}/${mid}/${encodeURIComponent(attachment)}`,
		{
			params,
			responseType: 'text'
		}
	);
	return resp.data;
}

async function setMailboxRead(box: MailboxBox, mid: string, read: boolean): Promise<void> {
	await httpClient.post(`/api/mailbox/${box}/${mid}/read`, { Read: read });
}

async function moveMessage(box: MailboxBox, mid: string): Promise<void> {
	await httpClient.post(`/api/mailbox/${box}`, null, {
		headers: { 'X-Pat-SourcePath': `/api/mailbox/${box}/${mid}` }
	});
}

function buildFormData(payload: OutboundMessagePayload): FormData {
	const formData = new FormData();
	if (payload.to) formData.append('to', payload.to);
	if (payload.cc) formData.append('cc', payload.cc);
	formData.append('subject', payload.subject);
	if (payload.body) formData.append('body', payload.body);
	if (payload.p2pOnly) formData.append('p2ponly', 'true');
	formData.append('date', payload.date);

	if (payload.files && payload.files.length > 0) {
		for (const file of payload.files) {
			const binaryString = atob(file.base64);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}
			const blob = new Blob([bytes], { type: file.mimeType || 'application/octet-stream' });
			const fieldName = file.fieldName || 'files';
			formData.append(fieldName, blob, file.name);
		}
	}

	return formData;
}

async function postOutboundMessage(payload: OutboundMessagePayload): Promise<string> {
	const formData = buildFormData(payload);
	const resp = await httpClient.post<string>('/api/mailbox/out', formData, {
		headers: { 'Content-Type': 'multipart/form-data' },
		responseType: 'text'
	});
	return resp.data;
}

async function getFormsCatalog(): Promise<FormFolder> {
	const resp = await httpClient.get<FormFolder>('/api/formcatalog');
	return resp.data;
}

async function updateForms(): Promise<FormsUpdateResponse> {
	const resp = await httpClient.post<FormsUpdateResponse>('/api/formsUpdate');
	return resp.data;
}

async function getTemplate(options: TemplateQueryOptions): Promise<string> {
	const params: Record<string, string | undefined> = { template: options.template };
	if (options.inReplyTo) params['in-reply-to'] = options.inReplyTo;
	const resp = await httpClient.get<string>('/api/template', { params, responseType: 'text' });
	return resp.data;
}

async function getFormData(): Promise<FormMessage> {
	const resp = await httpClient.get<FormMessage>('/api/form');
	return resp.data;
}

async function postFormData(payload: FormSubmissionPayload): Promise<string> {
	const params: Record<string, string | undefined> = { template: payload.template };
	if (payload.inReplyTo) params['in-reply-to'] = payload.inReplyTo;

	if (payload.formValues) {
		const formData = new FormData();
		for (const [key, value] of Object.entries(payload.formValues)) {
			formData.append(key, value);
		}
		const resp = await httpClient.post<string>('/api/form', formData, {
			params,
			headers: { 'Content-Type': 'multipart/form-data' },
			responseType: 'text'
		});
		return resp.data;
	} else {
		const jsonPayload = { responses: payload.responses || {} };
		const resp = await httpClient.post<string>('/api/form', jsonPayload, {
			params,
			headers: { 'Content-Type': 'application/json' },
			responseType: 'text'
		});
		return resp.data;
	}
}

async function getFormTemplate(options: TemplateQueryOptions): Promise<string> {
	const params: Record<string, string | undefined> = { template: options.template };
	if (options.inReplyTo) params['in-reply-to'] = options.inReplyTo;
	const resp = await httpClient.get<string>('/api/forms', { params, responseType: 'text' });
	return resp.data;
}

async function getFormAsset(
	path: string,
	responseType: 'text' | 'arraybuffer' = 'text'
): Promise<string | ArrayBuffer> {
	const resp = await httpClient.get<string | ArrayBuffer>(`/api/forms/${path}`, { responseType });
	return resp.data;
}

const httpPat: PatClient = {
	getRMSList,
	getBandwidths,
	getConnectAliases,
	getStatus,
	connectToStation,
	sendQSY,
	disconnect,
	getCurrentGpsPosition,
	coordsToLocator,
	postPositionReport,
	getConfig,
	updateConfig,
	getAlias,
	setAlias,
	deleteAlias,
	reload,
	getMailbox,
	getMessage,
	deleteMessage,
	getAttachment,
	getAttachmentText,
	setMailboxRead,
	moveMessage,
	postOutboundMessage,
	getFormsCatalog,
	updateForms,
	getTemplate,
	getFormData,
	postFormData,
	getFormTemplate,
	getFormAsset
};

const ipcPat: PatClient = {
	getRMSList: (params) => rendererGlobal!.api!.getRMSList(params),
	getBandwidths: (mode) => rendererGlobal!.api!.getBandwidths(mode),
	getConnectAliases: () => rendererGlobal!.api!.getConnectAliases(),
	getStatus: () => rendererGlobal!.api!.getStatus(),
	connectToStation: (rawUrl) => rendererGlobal!.api!.connectToStation(rawUrl),
	sendQSY: (data) => rendererGlobal!.api!.sendQSY(data),
	disconnect: (params) => rendererGlobal!.api!.disconnect(params),
	getCurrentGpsPosition: () => rendererGlobal!.api!.getCurrentGpsPosition(),
	coordsToLocator: (data) => rendererGlobal!.api!.coordsToLocator(data),
	postPositionReport: (data) => rendererGlobal!.api!.postPositionReport(data),
	getConfig: () => rendererGlobal!.api!.getConfig(),
	updateConfig: (config) => rendererGlobal!.api!.updateConfig(config),
	getAlias: (alias) => rendererGlobal!.api!.getAlias(alias),
	setAlias: (alias, value) => rendererGlobal!.api!.setAlias(alias, value),
	deleteAlias: (alias) => rendererGlobal!.api!.deleteAlias(alias),
	reload: () => rendererGlobal!.api!.reload(),
	getMailbox: (box) => rendererGlobal!.api!.getMailbox(box),
	getMessage: (box, mid) => rendererGlobal!.api!.getMessage(box, mid),
	deleteMessage: (box, mid) => rendererGlobal!.api!.deleteMessage(box, mid),
	getAttachment: (box, mid, attachment, options) =>
		rendererGlobal!.api!.getAttachment(box, mid, attachment, options),
	getAttachmentText: (box, mid, attachment, options) =>
		rendererGlobal!.api!.getAttachmentText(box, mid, attachment, options),
	setMailboxRead: (box, mid, read) => rendererGlobal!.api!.setMailboxRead(box, mid, read),
	moveMessage: (box, mid) => rendererGlobal!.api!.moveMessage(box, mid),
	postOutboundMessage: (payload) => rendererGlobal!.api!.postOutboundMessage(payload),
	getFormsCatalog: () => rendererGlobal!.api!.getFormsCatalog(),
	updateForms: () => rendererGlobal!.api!.updateForms(),
	getTemplate: (options) => rendererGlobal!.api!.getTemplate(options),
	getFormData: () => rendererGlobal!.api!.getFormData(),
	postFormData: (payload) => rendererGlobal!.api!.postFormData(payload),
	getFormTemplate: (options) => rendererGlobal!.api!.getFormTemplate(options),
	getFormAsset: (path, responseType) => rendererGlobal!.api!.getFormAsset(path, responseType)
};

const pat: PatClient = isElectronRenderer ? ipcPat : httpPat;

export default pat;
