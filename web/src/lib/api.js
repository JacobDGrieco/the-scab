export async function apiGet(path) {
	const resp = await fetch(path);
	const data = await resp.json().catch(() => ({}));
	if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);
	return data;
}
