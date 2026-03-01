import type {
	RMSStation,
	PatClient,
	Bandwidths,
	ConnectionAliases,
	StationValue,
	PatStatus
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
	connectToStation: (rawUrl: string) => Promise<StationValue>;
	sendQsy: (data: { transport: string; freq: number }) => Promise<void>;
};

type RendererGlobal = {
	electron?: unknown;
	api?: RendererPatAPI;
};


const isRenderer = typeof window !== 'undefined';
const rendererGlobal = (isRenderer ? window : undefined) as RendererGlobal | undefined;
const isElectronRenderer = isRenderer && Boolean(rendererGlobal?.api);

async function getRMSList(params: {
	mode?: string;
	band?: string;
	forceDownload?: boolean;
	predict?: boolean;
}) {
	const resp = await httpClient.get<RMSStation[]>('/api/rmslist', { params });
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

async function connectToStation(rawUrl: string) {
	const url = encodeURIComponent(rawUrl);
	const resp = await httpClient.get<StationValue>('/api/connect', { params: { url } });
	return resp.data;
}

async function sendQSY(data: { transport: string; freq: number }) {
	await httpClient.post('/api/qsy', data);
}

const httpPat: PatClient = {
	getRMSList,
	getBandwidths,
	getConnectAliases,
	getStatus,
	connectToStation,
	sendQSY
};

const ipcPat: PatClient = {
	getRMSList: (params) => rendererGlobal!.api!.getRMSList(params),
	getBandwidths: (mode) => rendererGlobal!.api!.getBandwidths(mode),
	getConnectAliases: () => rendererGlobal!.api!.getConnectAliases(),
	getStatus: () => rendererGlobal!.api!.getStatus(),
	connectToStation: (rawUrl) => rendererGlobal!.api!.connectToStation(rawUrl),
	sendQSY: (data) => rendererGlobal!.api!.sendQsy(data)
};

const pat: PatClient = isElectronRenderer ? ipcPat : httpPat;

export default pat;
