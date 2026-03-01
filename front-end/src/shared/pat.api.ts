import axios from 'axios';
import type {
	RMSStation,
	PatClient,
	Bandwidths,
	ConnectionAliases,
	StationValue,
	PatStatus
} from './pat.types';

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
const rendererGlobal = (isRenderer ? globalThis : undefined) as RendererGlobal | undefined;
const hasRendererApi = Boolean(rendererGlobal?.electron && rendererGlobal?.api);

const nodeBaseURL =
	typeof process !== 'undefined' && process.env?.PAT_API_BASE_URL
		? process.env.PAT_API_BASE_URL
		: 'http://127.0.0.1:8080';

const baseURL = isRenderer ? undefined : nodeBaseURL;
const httpClient = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } });

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
	throw new Error('Pat status is only available in Electron mode.');
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

const pat: PatClient = hasRendererApi ? ipcPat : httpPat;

export default pat;
