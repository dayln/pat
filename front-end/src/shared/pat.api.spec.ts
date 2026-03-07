import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PatStatus } from './pat.types';

const { httpGetMock, httpPostMock, httpPutMock, httpDeleteMock } = vi.hoisted(() => {
	return {
		httpGetMock: vi.fn(),
		httpPostMock: vi.fn(),
		httpPutMock: vi.fn(),
		httpDeleteMock: vi.fn()
	};
});

vi.mock('./httpClient', () => ({
	httpClient: {
		get: httpGetMock,
		post: httpPostMock,
		put: httpPutMock,
		delete: httpDeleteMock
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

	it('maps forceDownload and keeps params for getRMSList', async () => {
		vi.stubGlobal('window', {});
		httpGetMock.mockResolvedValue({ data: [] });

		const { default: pat } = await import('./pat.api');
		await pat.getRMSList({ mode: 'ardop', band: '40m', forceDownload: true, predict: true });

		expect(httpGetMock).toHaveBeenCalledWith('/api/rmslist', {
			params: {
				mode: 'ardop',
				band: '40m',
				predict: true,
				'force-download': true
			}
		});
	});

	it('passes raw url for connectToStation without pre-encoding', async () => {
		vi.stubGlobal('window', {});
		httpGetMock.mockResolvedValue({ data: { NumReceived: 0 } });
		const rawUrl = 'ardop:///K1ABC?freq=14105.5&bw=500';

		const { default: pat } = await import('./pat.api');
		await pat.connectToStation(rawUrl);

		expect(httpGetMock).toHaveBeenCalledWith('/api/connect', { params: { url: rawUrl } });
	});

	it('routes disconnect with dirty flag', async () => {
		vi.stubGlobal('window', {});
		httpPostMock.mockResolvedValue({ data: {} });

		const { default: pat } = await import('./pat.api');
		await pat.disconnect({ dirty: true });

		expect(httpPostMock).toHaveBeenCalledWith('/api/disconnect', undefined, {
			params: { dirty: true }
		});
	});

	it('routes disconnect without dirty params when omitted', async () => {
		vi.stubGlobal('window', {});
		httpPostMock.mockResolvedValue({ data: {} });

		const { default: pat } = await import('./pat.api');
		await pat.disconnect();

		expect(httpPostMock).toHaveBeenCalledWith('/api/disconnect', undefined, {
			params: undefined
		});
	});

	it('routes getCurrentGpsPosition to the gps endpoint', async () => {
		vi.stubGlobal('window', {});
		const gps = { Lat: 10, Lon: 20, Time: '2026-03-01T00:00:00Z' };
		httpGetMock.mockResolvedValue({ data: gps });

		const { default: pat } = await import('./pat.api');
		const result = await pat.getCurrentGpsPosition();

		expect(httpGetMock).toHaveBeenCalledWith('/api/current_gps_position');
		expect(result).toEqual(gps);
	});

	it('routes coordsToLocator to the conversion endpoint', async () => {
		vi.stubGlobal('window', {});
		httpPostMock.mockResolvedValue({ data: { locator: 'EN50aa' } });

		const { default: pat } = await import('./pat.api');
		const result = await pat.coordsToLocator({ lat: 41.5, lon: -87.6 });

		expect(httpPostMock).toHaveBeenCalledWith('/api/coords_to_locator', {
			lat: 41.5,
			lon: -87.6
		});
		expect(result).toEqual({ locator: 'EN50aa' });
	});

	it('routes postPositionReport and returns text response', async () => {
		vi.stubGlobal('window', {});
		httpPostMock.mockResolvedValue({ data: 'Position update posted' });
		const payload = {
			lat: 41.5,
			lon: -87.6,
			comment: 'testing',
			date: '2026-03-01T12:00:00.000Z'
		};

		const { default: pat } = await import('./pat.api');
		const result = await pat.postPositionReport(payload);

		expect(httpPostMock).toHaveBeenCalledWith('/api/posreport', payload, {
			responseType: 'text'
		});
		expect(result).toBe('Position update posted');
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
				sendQsy: vi.fn(),
				disconnect: vi.fn(),
				getCurrentGpsPosition: vi.fn(),
				coordsToLocator: vi.fn(),
				postPositionReport: vi.fn(),
				getConfig: vi.fn(),
				updateConfig: vi.fn(),
				getAlias: vi.fn(),
				setAlias: vi.fn(),
				deleteAlias: vi.fn(),
				reload: vi.fn()
			}
		});

		const { default: pat } = await import('./pat.api');
		const result = await pat.getStatus();

		expect(ipcGetStatus).toHaveBeenCalledTimes(1);
		expect(httpGetMock).not.toHaveBeenCalled();
		expect(result).toEqual(status);
	});

	it('forwards getCurrentGpsPosition through ipc when available', async () => {
		const gps = { Lat: 33.6, Lon: -112.1, Time: '2026-03-01T12:00:00Z' };
		const ipcGetCurrentGpsPosition = vi.fn().mockResolvedValue(gps);
		vi.stubGlobal('window', {
			api: {
				getRMSList: vi.fn(),
				getBandwidths: vi.fn(),
				getConnectAliases: vi.fn(),
				getStatus: vi.fn(),
				connectToStation: vi.fn(),
				sendQsy: vi.fn(),
				disconnect: vi.fn(),
				getCurrentGpsPosition: ipcGetCurrentGpsPosition,
				coordsToLocator: vi.fn(),
				postPositionReport: vi.fn(),
				getConfig: vi.fn(),
				updateConfig: vi.fn(),
				getAlias: vi.fn(),
				setAlias: vi.fn(),
				deleteAlias: vi.fn(),
				reload: vi.fn()
			}
		});

		const { default: pat } = await import('./pat.api');
		const result = await pat.getCurrentGpsPosition();

		expect(ipcGetCurrentGpsPosition).toHaveBeenCalledTimes(1);
		expect(httpGetMock).not.toHaveBeenCalled();
		expect(result).toEqual(gps);
	});

	describe('config endpoints', () => {
		it('routes getConfig to the config endpoint', async () => {
			vi.stubGlobal('window', {});
			const config = { mycall: 'W1ABC', locator: 'EN50aa' };
			httpGetMock.mockResolvedValue({ data: config });

			const { default: pat } = await import('./pat.api');
			const result = await pat.getConfig();

			expect(httpGetMock).toHaveBeenCalledWith('/api/config');
			expect(result).toEqual(config);
		});

		it('routes updateConfig to the config endpoint with PUT', async () => {
			vi.stubGlobal('window', {});
			httpPutMock.mockResolvedValue({ data: 'OK' });
			const config = { mycall: 'W1ABC', locator: 'EN50ab' };

			const { default: pat } = await import('./pat.api');
			await pat.updateConfig(config);

			expect(httpPutMock).toHaveBeenCalledWith('/api/config', config);
		});
	});

	describe('alias endpoints', () => {
		it('routes getAlias to the alias endpoint with encoded path', async () => {
			vi.stubGlobal('window', {});
			httpGetMock.mockResolvedValue({ data: 'ardop:///K1ABC?freq=14105.5' });

			const { default: pat } = await import('./pat.api');
			const result = await pat.getAlias('LA1B-10');

			expect(httpGetMock).toHaveBeenCalledWith('/api/config/connect_aliases/LA1B-10');
			expect(result).toBe('ardop:///K1ABC?freq=14105.5');
		});

		it('encodes special characters in alias name', async () => {
			vi.stubGlobal('window', {});
			httpGetMock.mockResolvedValue({ data: 'telnet://example.com' });

			const { default: pat } = await import('./pat.api');
			await pat.getAlias('TEST/ALIAS');

			expect(httpGetMock).toHaveBeenCalledWith('/api/config/connect_aliases/TEST%2FALIAS');
		});

		it('routes setAlias to the alias endpoint with PUT', async () => {
			vi.stubGlobal('window', {});
			httpPutMock.mockResolvedValue({ data: 'telnet://example.com:8772' });

			const { default: pat } = await import('./pat.api');
			const result = await pat.setAlias('MYTELNET', 'telnet://example.com:8772');

			expect(httpPutMock).toHaveBeenCalledWith(
				'/api/config/connect_aliases/MYTELNET',
				'telnet://example.com:8772'
			);
			expect(result).toBe('telnet://example.com:8772');
		});

		it('routes deleteAlias to the alias endpoint with DELETE', async () => {
			vi.stubGlobal('window', {});
			httpDeleteMock.mockResolvedValue({ status: 204 });

			const { default: pat } = await import('./pat.api');
			await pat.deleteAlias('OLDALIAS');

			expect(httpDeleteMock).toHaveBeenCalledWith('/api/config/connect_aliases/OLDALIAS');
		});
	});

	describe('reload endpoint', () => {
		it('routes reload to the reload endpoint', async () => {
			vi.stubGlobal('window', {});
			httpPostMock.mockResolvedValue({ status: 200 });

			const { default: pat } = await import('./pat.api');
			await pat.reload();

			expect(httpPostMock).toHaveBeenCalledWith('/api/reload');
		});
	});
});
