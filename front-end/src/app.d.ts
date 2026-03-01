// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { ElectronAPI } from '@electron-toolkit/preload';
import type {
	RMSStation,
	Bandwidths,
	ConnectionAliases,
	StationValue,
	PatStatus
} from './shared/pat.types';

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		electron: ElectronAPI;
		api: {
			start: (callSign: string) => Promise<void>;
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

export {};
