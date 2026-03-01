import axios from 'axios';

const nodeBaseURL =
	typeof process !== 'undefined' && process.env?.PAT_API_BASE_URL
		? process.env.PAT_API_BASE_URL
		: 'http://127.0.0.1:8080';

const baseURL = typeof window !== 'undefined' ? undefined : nodeBaseURL;

export const httpClient = axios.create({
	baseURL,
	headers: { 'Content-Type': 'application/json' }
});
