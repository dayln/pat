import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
				reload: vi.fn(),
				getMailbox: vi.fn(),
				getMessage: vi.fn(),
				deleteMessage: vi.fn(),
				getAttachment: vi.fn(),
				getAttachmentText: vi.fn(),
				setMailboxRead: vi.fn(),
				moveMessage: vi.fn(),
				postOutboundMessage: vi.fn(),
				getFormsCatalog: vi.fn(),
				updateForms: vi.fn(),
				getTemplate: vi.fn(),
				getFormData: vi.fn(),
				postFormData: vi.fn(),
				getFormTemplate: vi.fn(),
				getFormAsset: vi.fn(),
				checkNewRelease: vi.fn(),
				checkAccountExists: vi.fn(),
				registerAccount: vi.fn(),
				getPasswordRecoveryEmail: vi.fn(),
				setPasswordRecoveryEmail: vi.fn()
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
				reload: vi.fn(),
				getMailbox: vi.fn(),
				getMessage: vi.fn(),
				deleteMessage: vi.fn(),
				getAttachment: vi.fn(),
				getAttachmentText: vi.fn(),
				setMailboxRead: vi.fn(),
				moveMessage: vi.fn(),
				postOutboundMessage: vi.fn(),
				getFormsCatalog: vi.fn(),
				updateForms: vi.fn(),
				getTemplate: vi.fn(),
				getFormData: vi.fn(),
				postFormData: vi.fn(),
				getFormTemplate: vi.fn(),
				getFormAsset: vi.fn(),
				checkNewRelease: vi.fn(),
				checkAccountExists: vi.fn(),
				registerAccount: vi.fn(),
				getPasswordRecoveryEmail: vi.fn(),
				setPasswordRecoveryEmail: vi.fn()
			}
		});

		const { default: pat } = await import('./pat.api');
		const result = await pat.getCurrentGpsPosition();

		expect(ipcGetCurrentGpsPosition).toHaveBeenCalledTimes(1);
		expect(httpGetMock).not.toHaveBeenCalled();
		expect(result).toEqual(gps);
	});

	describe('phase 1 endpoints', () => {
		it('routes sendQSY to the qsy endpoint', async () => {
			vi.stubGlobal('window', {});
			httpPostMock.mockResolvedValue({ status: 200 });

			const { default: pat } = await import('./pat.api');
			await pat.sendQSY({ transport: 'ardop', freq: 14105.5 });

			expect(httpPostMock).toHaveBeenCalledWith('/api/qsy', {
				transport: 'ardop',
				freq: 14105.5
			});
		});

		it('routes getBandwidths with mode param', async () => {
			vi.stubGlobal('window', {});
			const bandwidths = { mode: 'ardop', bandwidths: ['500', '1000'], default: '500' };
			httpGetMock.mockResolvedValue({ data: bandwidths });

			const { default: pat } = await import('./pat.api');
			const result = await pat.getBandwidths('ardop');

			expect(httpGetMock).toHaveBeenCalledWith('/api/bandwidths', { params: { mode: 'ardop' } });
			expect(result).toEqual(bandwidths);
		});
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

		it('routes getConnectAliases to non-deprecated endpoint', async () => {
			vi.stubGlobal('window', {});
			const aliases = { ALIAS1: 'ardop:///K1ABC' };
			httpGetMock.mockResolvedValue({ data: aliases });

			const { default: pat } = await import('./pat.api');
			const result = await pat.getConnectAliases();

			expect(httpGetMock).toHaveBeenCalledWith('/api/config/connect_aliases');
			expect(result).toEqual(aliases);
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

	describe('mailbox endpoints', () => {
		it('routes getMailbox to the mailbox endpoint', async () => {
			vi.stubGlobal('window', {});
			const messages = [{ MID: 'msg1', Subject: 'Test' }];
			httpGetMock.mockResolvedValue({ data: messages });

			const { default: pat } = await import('./pat.api');
			const result = await pat.getMailbox('in');

			expect(httpGetMock).toHaveBeenCalledWith('/api/mailbox/in');
			expect(result).toEqual(messages);
		});

		it('routes getMessage to the message detail endpoint', async () => {
			vi.stubGlobal('window', {});
			const message = { MID: 'msg1', Subject: 'Test', Body: 'Hello' };
			httpGetMock.mockResolvedValue({ data: message });

			const { default: pat } = await import('./pat.api');
			const result = await pat.getMessage('in', 'msg1');

			expect(httpGetMock).toHaveBeenCalledWith('/api/mailbox/in/msg1');
			expect(result).toEqual(message);
		});

		it('routes deleteMessage to the message delete endpoint', async () => {
			vi.stubGlobal('window', {});
			httpDeleteMock.mockResolvedValue({ status: 200 });

			const { default: pat } = await import('./pat.api');
			await pat.deleteMessage('in', 'msg1');

			expect(httpDeleteMock).toHaveBeenCalledWith('/api/mailbox/in/msg1');
		});

		it('routes getAttachment with arraybuffer response', async () => {
			vi.stubGlobal('window', {});
			const buffer = new ArrayBuffer(8);
			httpGetMock.mockResolvedValue({ data: buffer });

			const { default: pat } = await import('./pat.api');
			const result = await pat.getAttachment('in', 'msg1', 'file.txt');

			expect(httpGetMock).toHaveBeenCalledWith('/api/mailbox/in/msg1/file.txt', {
				params: {},
				responseType: 'arraybuffer'
			});
			expect(result).toBe(buffer);
		});

		it('routes getAttachment with query params', async () => {
			vi.stubGlobal('window', {});
			const buffer = new ArrayBuffer(8);
			httpGetMock.mockResolvedValue({ data: buffer });

			const { default: pat } = await import('./pat.api');
			await pat.getAttachment('in', 'msg1', 'file.txt', {
				inReplyTo: 'msg0',
				renderToHtml: true
			});

			expect(httpGetMock).toHaveBeenCalledWith('/api/mailbox/in/msg1/file.txt', {
				params: { 'in-reply-to': 'msg0', rendertohtml: true },
				responseType: 'arraybuffer'
			});
		});

		it('routes getAttachmentText with text response', async () => {
			vi.stubGlobal('window', {});
			httpGetMock.mockResolvedValue({ data: 'file content' });

			const { default: pat } = await import('./pat.api');
			const result = await pat.getAttachmentText('in', 'msg1', 'file.txt');

			expect(httpGetMock).toHaveBeenCalledWith('/api/mailbox/in/msg1/file.txt', {
				params: {},
				responseType: 'text'
			});
			expect(result).toBe('file content');
		});

		it('encodes special characters in attachment name', async () => {
			vi.stubGlobal('window', {});
			httpGetMock.mockResolvedValue({ data: new ArrayBuffer(0) });

			const { default: pat } = await import('./pat.api');
			await pat.getAttachment('in', 'msg1', 'file name.txt');

			expect(httpGetMock).toHaveBeenCalledWith('/api/mailbox/in/msg1/file%20name.txt', {
				params: {},
				responseType: 'arraybuffer'
			});
		});

		it('routes setMailboxRead to the read endpoint', async () => {
			vi.stubGlobal('window', {});
			httpPostMock.mockResolvedValue({ status: 200 });

			const { default: pat } = await import('./pat.api');
			await pat.setMailboxRead('in', 'msg1', true);

			expect(httpPostMock).toHaveBeenCalledWith('/api/mailbox/in/msg1/read', { Read: true });
		});

		it('routes moveMessage with X-Pat-SourcePath header', async () => {
			vi.stubGlobal('window', {});
			httpPostMock.mockResolvedValue({ status: 200 });

			const { default: pat } = await import('./pat.api');
			await pat.moveMessage('archive', 'msg1');

			expect(httpPostMock).toHaveBeenCalledWith('/api/mailbox/archive', null, {
				headers: { 'X-Pat-SourcePath': '/api/mailbox/archive/msg1' }
			});
		});

		describe('postOutboundMessage', () => {
			beforeEach(() => {
				vi.stubGlobal('window', {});
				vi.stubGlobal('FormData', FormData);
				vi.stubGlobal('atob', (str: string) => {
					return Buffer.from(str, 'base64').toString('binary');
				});
			});

			it('posts outbound message with FormData', async () => {
				httpPostMock.mockResolvedValue({ data: 'Message posted' });

				const { default: pat } = await import('./pat.api');
				const result = await pat.postOutboundMessage({
					to: 'test@example.com',
					subject: 'Test',
					body: 'Hello',
					date: '2026-03-07T12:00:00Z'
				});

				expect(httpPostMock).toHaveBeenCalled();
				const [url, formData, config] = httpPostMock.mock.calls[0];
				expect(url).toBe('/api/mailbox/out');
				expect(formData).toBeInstanceOf(FormData);
				expect(config.headers).toEqual({ 'Content-Type': 'multipart/form-data' });
				expect(config.responseType).toBe('text');
				expect(result).toBe('Message posted');
			});

			it('includes files in outbound message', async () => {
				httpPostMock.mockResolvedValue({ data: 'Message posted' });

				const { default: pat } = await import('./pat.api');
				await pat.postOutboundMessage({
					subject: 'Test',
					date: '2026-03-07T12:00:00Z',
					files: [
						{
							name: 'test.txt',
							mimeType: 'text/plain',
							base64: 'SGVsbG8gV29ybGQ='
						}
					]
				});

				expect(httpPostMock).toHaveBeenCalled();
			});

			it('sets p2pOnly flag', async () => {
				httpPostMock.mockResolvedValue({ data: 'Message posted' });

				const { default: pat } = await import('./pat.api');
				await pat.postOutboundMessage({
					subject: 'Test',
					date: '2026-03-07T12:00:00Z',
					p2pOnly: true
				});

				expect(httpPostMock).toHaveBeenCalled();
			});
		});
	});

	describe('forms endpoints', () => {
		it('routes getFormsCatalog to the formcatalog endpoint', async () => {
			vi.stubGlobal('window', {});
			const catalog = {
				name: 'Standard Forms',
				path: '/forms',
				version: '1.0',
				form_count: 5,
				forms: [],
				folders: []
			};
			httpGetMock.mockResolvedValue({ data: catalog });

			const { default: pat } = await import('./pat.api');
			const result = await pat.getFormsCatalog();

			expect(httpGetMock).toHaveBeenCalledWith('/api/formcatalog');
			expect(result).toEqual(catalog);
		});

		it('routes updateForms to the formsUpdate endpoint', async () => {
			vi.stubGlobal('window', {});
			const response = { newestVersion: '1.1', action: 'update' };
			httpPostMock.mockResolvedValue({ data: response });

			const { default: pat } = await import('./pat.api');
			const result = await pat.updateForms();

			expect(httpPostMock).toHaveBeenCalledWith('/api/formsUpdate');
			expect(result).toEqual(response);
		});

		it('routes getTemplate with query params', async () => {
			vi.stubGlobal('window', {});
			httpGetMock.mockResolvedValue({ data: 'template content' });

			const { default: pat } = await import('./pat.api');
			const result = await pat.getTemplate({ template: 'forms/test.txt', inReplyTo: 'msg1' });

			expect(httpGetMock).toHaveBeenCalledWith('/api/template', {
				params: { template: 'forms/test.txt', 'in-reply-to': 'msg1' },
				responseType: 'text'
			});
			expect(result).toBe('template content');
		});

		it('routes getFormData to the form endpoint', async () => {
			vi.stubGlobal('window', {});
			const formMessage = {
				msg_to: 'test@test.com',
				msg_cc: '',
				msg_subject: 'Test',
				msg_body: 'Hello'
			};
			httpGetMock.mockResolvedValue({ data: formMessage });

			const { default: pat } = await import('./pat.api');
			const result = await pat.getFormData();

			expect(httpGetMock).toHaveBeenCalledWith('/api/form');
			expect(result).toEqual(formMessage);
		});

		describe('postFormData', () => {
			beforeEach(() => {
				vi.stubGlobal('window', {});
				vi.stubGlobal('FormData', FormData);
			});

			it('posts form data with formValues (multipart)', async () => {
				httpPostMock.mockResolvedValue({ data: '<script>window.close()</script>' });

				const { default: pat } = await import('./pat.api');
				const result = await pat.postFormData({
					template: 'forms/test.txt',
					formValues: { field1: 'value1', field2: 'value2' }
				});

				expect(httpPostMock).toHaveBeenCalled();
				const [url, , config] = httpPostMock.mock.calls[0];
				expect(url).toBe('/api/form');
				expect(config.params).toEqual({ template: 'forms/test.txt' });
				expect(config.headers).toEqual({ 'Content-Type': 'multipart/form-data' });
				expect(result).toBe('<script>window.close()</script>');
			});

			it('posts form data with responses (JSON)', async () => {
				httpPostMock.mockResolvedValue({ data: '<script>window.close()</script>' });

				const { default: pat } = await import('./pat.api');
				await pat.postFormData({
					template: 'forms/test.txt',
					inReplyTo: 'msg1',
					responses: { prompt1: 'answer1' }
				});

				expect(httpPostMock).toHaveBeenCalled();
				const [url, payload, config] = httpPostMock.mock.calls[0];
				expect(url).toBe('/api/form');
				expect(config.params).toEqual({ template: 'forms/test.txt', 'in-reply-to': 'msg1' });
				expect(config.headers).toEqual({ 'Content-Type': 'application/json' });
				expect(payload).toEqual({ responses: { prompt1: 'answer1' } });
			});
		});

		it('routes getFormTemplate with query params', async () => {
			vi.stubGlobal('window', {});
			httpGetMock.mockResolvedValue({ data: '<html><body>Form</body></html>' });

			const { default: pat } = await import('./pat.api');
			const result = await pat.getFormTemplate({ template: 'forms/test.txt' });

			expect(httpGetMock).toHaveBeenCalledWith('/api/forms', {
				params: { template: 'forms/test.txt' },
				responseType: 'text'
			});
			expect(result).toBe('<html><body>Form</body></html>');
		});

		it('routes getFormAsset with text response by default', async () => {
			vi.stubGlobal('window', {});
			httpGetMock.mockResolvedValue({ data: 'asset content' });

			const { default: pat } = await import('./pat.api');
			const result = await pat.getFormAsset('styles/main.css');

			expect(httpGetMock).toHaveBeenCalledWith('/api/forms/styles/main.css', {
				responseType: 'text'
			});
			expect(result).toBe('asset content');
		});

		it('routes getFormAsset with arraybuffer response', async () => {
			vi.stubGlobal('window', {});
			const buffer = new ArrayBuffer(8);
			httpGetMock.mockResolvedValue({ data: buffer });

			const { default: pat } = await import('./pat.api');
			const result = await pat.getFormAsset('images/logo.png', 'arraybuffer');

			expect(httpGetMock).toHaveBeenCalledWith('/api/forms/images/logo.png', {
				responseType: 'arraybuffer'
			});
			expect(result).toBe(buffer);
		});
	});

	describe('winlink account endpoints', () => {
		it('routes checkNewRelease and returns release on 200', async () => {
			vi.stubGlobal('window', {});
			const release = { version: 'v1.0.0', release_url: 'https://example.com/release' };
			httpGetMock.mockResolvedValue({ status: 200, data: release });

			const { default: pat } = await import('./pat.api');
			const result = await pat.checkNewRelease();

			expect(httpGetMock).toHaveBeenCalledWith('/api/new-release-check', {
				validateStatus: expect.any(Function)
			});
			expect(result).toEqual(release);
		});

		it('routes checkNewRelease and returns null on 204', async () => {
			vi.stubGlobal('window', {});
			httpGetMock.mockResolvedValue({ status: 204 });

			const { default: pat } = await import('./pat.api');
			const result = await pat.checkNewRelease();

			expect(httpGetMock).toHaveBeenCalledWith('/api/new-release-check', {
				validateStatus: expect.any(Function)
			});
			expect(result).toBeNull();
		});

		it('routes checkAccountExists with callsign param', async () => {
			vi.stubGlobal('window', {});
			const response = { callsign: 'W1ABC', exists: true };
			httpGetMock.mockResolvedValue({ data: response });

			const { default: pat } = await import('./pat.api');
			const result = await pat.checkAccountExists('W1ABC');

			expect(httpGetMock).toHaveBeenCalledWith('/api/winlink-account/registration', {
				params: { callsign: 'W1ABC' }
			});
			expect(result).toEqual(response);
		});

		it('routes checkAccountExists without callsign param', async () => {
			vi.stubGlobal('window', {});
			const response = { callsign: 'W1ABC', exists: false };
			httpGetMock.mockResolvedValue({ data: response });

			const { default: pat } = await import('./pat.api');
			const result = await pat.checkAccountExists();

			expect(httpGetMock).toHaveBeenCalledWith('/api/winlink-account/registration', {
				params: undefined
			});
			expect(result).toEqual(response);
		});

		it('routes registerAccount with POST', async () => {
			vi.stubGlobal('window', {});
			const payload = { callsign: 'W1ABC', password: 'test123', recovery_email: 'test@test.com' };
			httpPostMock.mockResolvedValue({ data: payload });

			const { default: pat } = await import('./pat.api');
			const result = await pat.registerAccount(payload);

			expect(httpPostMock).toHaveBeenCalledWith('/api/winlink-account/registration', payload);
			expect(result).toEqual(payload);
		});

		it('routes getPasswordRecoveryEmail', async () => {
			vi.stubGlobal('window', {});
			const response = { recovery_email: 'test@test.com' };
			httpGetMock.mockResolvedValue({ data: response });

			const { default: pat } = await import('./pat.api');
			const result = await pat.getPasswordRecoveryEmail();

			expect(httpGetMock).toHaveBeenCalledWith('/api/winlink-account/password-recovery-email');
			expect(result).toEqual(response);
		});

		it('routes setPasswordRecoveryEmail with PUT', async () => {
			vi.stubGlobal('window', {});
			const response = { recovery_email: 'new@test.com' };
			httpPutMock.mockResolvedValue({ data: response });

			const { default: pat } = await import('./pat.api');
			const result = await pat.setPasswordRecoveryEmail('new@test.com');

			expect(httpPutMock).toHaveBeenCalledWith('/api/winlink-account/password-recovery-email', {
				recovery_email: 'new@test.com'
			});
			expect(result).toEqual(response);
		});
	});
});
