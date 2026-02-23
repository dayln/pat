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
	bandwidths: string[];
	default: string;
}

export type ConnectionAliases = Record<string, string>;

// Determine what this represents
export interface StationValue {
	NumReceived: number;
}

export interface PatClient {
	getRMSList: (param: {
		mode?: string;
		band?: string;
		forceDownload?: boolean;
		predict?: boolean;
	}) => Promise<RMSStation[]>;
	getBandwidths: (mode: string) => Promise<Bandwidths>;
	getConnectAliases: () => Promise<ConnectionAliases>;
	connectToStation: (rawUrl: string) => Promise<StationValue>;
	sendQSY: (data: { transport: string; freq: number }) => Promise<void>;
}
