import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PatStatus } from './pat.types';

const { httpGetMock, httpPostMock } = vi.hoisted(() => {
	return {
		httpGetMock: vi.fn(),
		httpPostMock: vi.fn()
	};
});

vi.mock('./httpClient', () => ({
	httpClient: {
		get: httpGetMock,
		post: httpPostMock
	}
}));

describe('pat client selection', () => {
	afterEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		vi.unstubAllGlobals();
	});

	it('uses http client when window.api is unavailable', async () => {
		vi.stubGlobal('window', {});
		const status: PatStatus = {
			active_listeners: ['ardop'],
			connected: true,
			dialing: false,
			remote_addr: 'tcp:example:8772',
			http_clients: ['127.0.0.1:1234'],
			config_hash: 'abc123'
		};
		httpGetMock.mockResolvedValue({ data: status });

		const { default: pat } = await import('./pat.api');
		const result = await pat.getStatus();

		expect(httpGetMock).toHaveBeenCalledWith('/api/status');
		expect(result).toEqual(status);
	});

	it('uses ipc client when window.api is available', async () => {
		const status: PatStatus = {
			active_listeners: [],
			connected: false,
			dialing: false,
			remote_addr: '',
			http_clients: [],
			config_hash: 'def456'
		};
		const ipcGetStatus = vi.fn().mockResolvedValue(status);
		vi.stubGlobal('window', {
			api: {
				getRMSList: vi.fn(),
				getBandwidths: vi.fn(),
				getConnectAliases: vi.fn(),
				getStatus: ipcGetStatus,
				connectToStation: vi.fn(),
				sendQsy: vi.fn()
			}
		});

		const { default: pat } = await import('./pat.api');
		const result = await pat.getStatus();

		expect(ipcGetStatus).toHaveBeenCalledTimes(1);
		expect(httpGetMock).not.toHaveBeenCalled();
		expect(result).toEqual(status);
	});
});
