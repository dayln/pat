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
	PatConfig
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
	reload
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
	reload: () => rendererGlobal!.api!.reload()
};

const pat: PatClient = isElectronRenderer ? ipcPat : httpPat;

export default pat;
