import axios from 'axios';
import {
	type RMSStation,
	type PatClient,
	Bandwidths,
	ConnectionAliases,
	StationValue
} from './pat.types';

// Consider creating a class to ahanld this
const isElectron = true;
const baseURL = isElectron ? 'http://127.0.0.1' : undefined;
const client = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } });

async function getRMSList(params: {
	mode?: string;
	band?: string;
	forceDownload?: boolean;
	predict?: boolean;
}) {
	// TODO consider using common Error types
	const resp = await client.get<RMSStation[]>('/api/rmslist', { params });
	return resp.data;
}

async function getBandwidths(mode: string) {
	const resp = await client.get<Bandwidths>('/api/bandwidths', { params: { mode } });
	return resp.data;
}

async function getConnectAliases() {
	const resp = await client.get<ConnectionAliases>('/api/connect_aliases');
	return resp.data;
}

async function connectToStation(rawUrl: string) {
	const url = encodeURIComponent(rawUrl);
	const resp = await client.get<StationValue>('/api/connect', { params: { url } });
	return resp.data;
}

async function sendQSY(data: { transport: string; freq: number }) {
	await client.post('/api/qsy', data);
}

const pat: PatClient = {
	getRMSList,
	getBandwidths,
	getConnectAliases,
	connectToStation,
	sendQSY
};

export default pat;
