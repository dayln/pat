import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('renders when window.api is unavailable', async () => {
		const originalApi = (window as Window & { api?: unknown }).api;
		delete (window as Window & { api?: unknown }).api;

		render(Page);

		const heading = page.getByRole('heading', { level: 1 });
		await expect.element(heading).toBeInTheDocument();

		if (originalApi !== undefined) {
			(window as Window & { api?: unknown }).api = originalApi;
		}
	});
});
