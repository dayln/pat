export interface RMSStation {
	callsign: string;
	distance: number;
	modes: string;
	dial: {
		desc: string;
		freq: number;
	};
	link_quality: number;
	url: string;
}

export interface Bandwidths {
	mode?: string;
	bandwidths: string[];
	default: string;
}

export type ConnectionAliases = Record<string, string>;

export interface PatStatus {
	active_listeners: string[];
	connected: boolean;
	dialing: boolean;
	remote_addr: string;
	http_clients: string[];
	config_hash: string;
}

export interface ConnectResult {
	NumReceived: number;
}

export type StationValue = ConnectResult;

export interface QsyPayload {
	transport: string;
	freq: number;
}

export interface DisconnectParams {
	dirty?: boolean;
}

export interface GpsPosition {
	Lat: number;
	Lon: number;
	Time: string;
	Alt?: number;
	Track?: number;
	Speed?: number;
	Mode?: number;
	Device?: string;
}

export interface CoordsToLocatorPayload {
	lat: number;
	lon: number;
}

export interface CoordsToLocatorResponse {
	locator: string;
}

export interface PositionReportPayload {
	lat: number;
	lon: number;
	comment?: string;
	date?: string | Date;
}

export interface PatClient {
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
	sendQSY: (data: QsyPayload) => Promise<void>;
	disconnect: (params?: DisconnectParams) => Promise<void>;
	getCurrentGpsPosition: () => Promise<GpsPosition>;
	coordsToLocator: (data: CoordsToLocatorPayload) => Promise<CoordsToLocatorResponse>;
	postPositionReport: (data: PositionReportPayload) => Promise<string>;
}
