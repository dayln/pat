// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { ElectronAPI } from '@electron-toolkit/preload';
import type { PatClient } from './shared/pat.types';

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		electron?: ElectronAPI;
		api?: PatClient;
	}
}

export {};
