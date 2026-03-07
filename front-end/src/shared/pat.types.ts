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
	mode?: string;
	bandwidths: string[];
	default: string;
}

export type ConnectionAliases = Record<string, string>;

export interface PatStatus {
	active_listeners: string[];
	connected: boolean;
	dialing: boolean;
	remote_addr: string;
	http_clients: string[];
	config_hash: string;
}

export interface ConnectResult {
	NumReceived: number;
}

export type StationValue = ConnectResult;

export interface QsyPayload {
	transport: string;
	freq: number;
}

export interface DisconnectParams {
	dirty?: boolean;
}

export interface GpsPosition {
	Lat: number;
	Lon: number;
	Time: string;
	Alt?: number;
	Track?: number;
	Speed?: number;
	Mode?: number;
	Device?: string;
}

export interface CoordsToLocatorPayload {
	lat: number;
	lon: number;
}

export interface CoordsToLocatorResponse {
	locator: string;
}

export interface PositionReportPayload {
	lat: number;
	lon: number;
	comment?: string;
	date?: string | Date;
}

export interface HamlibConfig {
	path?: string;
	network?: string;
	rig_model?: number;
	ptt_type?: string;
}

export interface ArdopConfig {
	arq_bandwidth?: string;
	listen?: boolean;
	rig?: string;
	pwr_on?: boolean;
}

export interface VaraConfig {
	host?: string;
	cmd_port?: number;
	data_port?: number;
	password?: string;
	bandwidth?: number;
	listen?: boolean;
	rig?: string;
}

export interface PactorConfig {
	path?: string;
	baudrate?: number;
	init_script?: string;
}

export interface TelnetConfig {
	listen_addr?: string;
	password?: string;
}

export interface SerialTNCConfig {
	path?: string;
	baudrate?: number;
	type?: string;
}

export interface AGWPEConfig {
	addr?: string;
	port?: number;
}

export interface AX25Config {
	port?: string;
	beat_interval?: number;
}

export interface AX25LinuxConfig {
	interface?: string;
}

export interface BeaconConfig {
	every?: number;
	message?: string;
}

export interface GPSdConfig {
	addr?: string;
	use_for_time?: boolean;
	enable_http?: boolean;
}

export interface PredictionConfig {
	enabled?: boolean;
	voacap?: VOACAPConfig;
}

export interface VOACAPConfig {
	mode?: string;
	api?: VOACAPAPIConfig;
}

export interface VOACAPAPIConfig {
	url?: string;
	key?: string;
}

export interface AuxAddr {
	Address: string;
	Password?: string;
}

export interface PatConfig {
	mycall: string;
	secure_login_password?: string;
	auxiliary_addresses?: AuxAddr[];
	locator?: string;
	auto_download_size_limit?: number;
	service_codes?: string[];
	http_addr?: string;
	motd?: string[];
	connect_aliases?: Record<string, string>;
	listen?: string[];
	hamlib_rigs?: Record<string, HamlibConfig>;
	ax25?: AX25Config;
	ax25_linux?: AX25LinuxConfig;
	agwpe?: AGWPEConfig;
	'serial-tnc'?: SerialTNCConfig;
	ardop?: ArdopConfig;
	pactor?: PactorConfig;
	telnet?: TelnetConfig;
	varahf?: VaraConfig;
	varafm?: VaraConfig;
	gpsd?: GPSdConfig;
	prediction?: PredictionConfig;
	schedule?: Record<string, string>;
	version_reporting_disabled?: boolean;
}

export interface AliasPayload {
	key: string;
	value: string;
}

export type MailboxBox = 'in' | 'out' | 'sent' | 'archive';

export interface MessageAddress {
	Addr: string;
	Name?: string;
}

export interface MessageFile {
	Name: string;
	Size: number;
	Data?: number[];
}

export interface MessageSummary {
	MID: string;
	Date: string;
	From: MessageAddress;
	To: MessageAddress[];
	Cc: MessageAddress[];
	Subject: string;
	Files: MessageFile[];
	P2POnly: boolean;
	Unread: boolean;
}

export interface MessageDetail extends MessageSummary {
	Body: string;
	BodyHTML: string;
}

export interface AttachmentRequestOptions {
	inReplyTo?: string;
	renderToHtml?: boolean;
}

export interface MoveMessagePayload {
	sourcePath: string;
}

export interface SerializedUploadFile {
	name: string;
	mimeType?: string;
	base64: string;
	fieldName?: string;
}

export interface OutboundMessagePayload {
	to?: string;
	cc?: string;
	subject: string;
	body?: string;
	p2pOnly?: boolean;
	date: string;
	files?: SerializedUploadFile[];
}

export interface FormTemplate {
	name: string;
	template_path: string;
}

export interface FormFolder {
	name: string;
	path: string;
	version: string;
	form_count: number;
	forms: FormTemplate[];
	folders: FormFolder[];
}

export interface FormsUpdateResponse {
	newestVersion: string;
	action: string;
}

export interface FormMessage {
	msg_to: string;
	msg_cc: string;
	msg_subject: string;
	msg_body: string;
}

export interface TemplateQueryOptions {
	template: string;
	inReplyTo?: string;
}

export interface FormSubmissionPayload {
	template: string;
	inReplyTo?: string;
	formValues?: Record<string, string>;
	responses?: Record<string, string>;
}

export interface LatestRelease {
	version: string;
	release_url: string;
}

export interface AccountExistsResponse {
	callsign: string;
	exists: boolean;
}

export interface RegistrationPayload {
	callsign: string;
	password: string;
	recovery_email?: string;
}

export interface RecoveryEmailResponse {
	recovery_email: string;
}

export interface PatClient {
	getRMSList: (params: {
		mode?: string;
		band?: string;
		forceDownload?: boolean;
		predict?: boolean;
	}) => Promise<RMSStation[]>;
	getBandwidths: (mode: string) => Promise<Bandwidths>;
	getConnectAliases: () => Promise<ConnectionAliases>;
	getStatus: () => Promise<PatStatus>;
	connectToStation: (rawUrl: string) => Promise<ConnectResult>;
	sendQSY: (data: QsyPayload) => Promise<void>;
	disconnect: (params?: DisconnectParams) => Promise<void>;
	getCurrentGpsPosition: () => Promise<GpsPosition>;
	coordsToLocator: (data: CoordsToLocatorPayload) => Promise<CoordsToLocatorResponse>;
	postPositionReport: (data: PositionReportPayload) => Promise<string>;
	getConfig: () => Promise<PatConfig>;
	updateConfig: (config: PatConfig) => Promise<void>;
	getAlias: (alias: string) => Promise<string>;
	setAlias: (alias: string, value: string) => Promise<string>;
	deleteAlias: (alias: string) => Promise<void>;
	reload: () => Promise<void>;
	getMailbox: (box: MailboxBox) => Promise<MessageSummary[]>;
	getMessage: (box: MailboxBox, mid: string) => Promise<MessageDetail>;
	deleteMessage: (box: MailboxBox, mid: string) => Promise<void>;
	getAttachment: (
		box: MailboxBox,
		mid: string,
		attachment: string,
		options?: AttachmentRequestOptions
	) => Promise<ArrayBuffer>;
	getAttachmentText: (
		box: MailboxBox,
		mid: string,
		attachment: string,
		options?: AttachmentRequestOptions
	) => Promise<string>;
	setMailboxRead: (box: MailboxBox, mid: string, read: boolean) => Promise<void>;
	moveMessage: (box: MailboxBox, mid: string) => Promise<void>;
	postOutboundMessage: (payload: OutboundMessagePayload) => Promise<string>;
	getFormsCatalog: () => Promise<FormFolder>;
	updateForms: () => Promise<FormsUpdateResponse>;
	getTemplate: (options: TemplateQueryOptions) => Promise<string>;
	getFormData: () => Promise<FormMessage>;
	postFormData: (payload: FormSubmissionPayload) => Promise<string>;
	getFormTemplate: (options: TemplateQueryOptions) => Promise<string>;
	getFormAsset: (
		path: string,
		responseType?: 'text' | 'arraybuffer'
	) => Promise<string | ArrayBuffer>;
	checkNewRelease: () => Promise<LatestRelease | null>;
	checkAccountExists: (callsign?: string) => Promise<AccountExistsResponse>;
	registerAccount: (payload: RegistrationPayload) => Promise<RegistrationPayload>;
	getPasswordRecoveryEmail: () => Promise<RecoveryEmailResponse>;
	setPasswordRecoveryEmail: (email: string) => Promise<RecoveryEmailResponse>;
}
