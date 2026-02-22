import { defineConfig } from 'electron-vite';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
	main: {
		build: {
			rollupOptions: {
				input: {
					index: resolve(__dirname, 'src/electron/main/index.ts')
				}
			}
		}
	},
	preload: {
		build: {
			rollupOptions: {
				input: {
					index: resolve(__dirname, 'src/electron/preload/index.ts')
				}
			}
		}
	},
	renderer: {
		plugins: [tailwindcss(), sveltekit()],
		build: {
			rollupOptions: {
				input: {
					index: resolve(__dirname, 'src/app.html')
				}
			}
		}
	}
});
