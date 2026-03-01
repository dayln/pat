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
	PositionReportPayload
} from './pat.types';
import { httpClient } from './httpClient';

type RendererPatAPI = {
	getRMSList: (params: {
		mode?: string;
		band?: string;
		forceDownload?: boolean;
		predict?: boolean;
	}) => Promise<RMSStation[]>;
	getBandwidths: (mode: string) => Promise<Bandwidths>;
	getConnectAliases: () => Promise<ConnectionAliases>;
	getStatus: () => Promise<PatStatus>;
	connectToStation: (rawUrl: string) => Promise<ConnectResult>;
	sendQsy: (data: QsyPayload) => Promise<void>;
	disconnect: (params?: DisconnectParams) => Promise<void>;
	getCurrentGpsPosition: () => Promise<GpsPosition>;
	coordsToLocator: (data: CoordsToLocatorPayload) => Promise<CoordsToLocatorResponse>;
	postPositionReport: (data: PositionReportPayload) => Promise<string>;
};

const isRenderer = typeof window !== 'undefined';
const rendererGlobal = (isRenderer ? window : undefined) as Window | undefined;
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
	postPositionReport
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
	postPositionReport: (data) => rendererGlobal!.api!.postPositionReport(data)
};

const pat: PatClient = isElectronRenderer ? ipcPat : httpPat;

export default pat;
