import { ElectronAPI } from '@electron-toolkit/preload';
import type { PatClient } from '../../shared/pat.types';

declare global {
	interface Window {
		electron?: ElectronAPI;
		api?: PatClient;
	}
}
