import { ElectronAPI } from '@electron-toolkit/preload';
import type {
	RMSStation,
	Bandwidths,
	ConnectionAliases,
	StationValue,
	PatStatus
} from '../../shared/pat.types';

declare global {
	interface Window {
		electron: ElectronAPI;
		api: {
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
	}
}
