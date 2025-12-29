export function money(n) {
	if (n == null || Number.isNaN(Number(n))) return "—";
	return `$${Number(n).toFixed(2)}`;
}

export function pct(n) {
	if (n == null || Number.isNaN(Number(n))) return "—";
	return `${Number(n).toFixed(1)}%`;
}

export function escapeHtml(str) {
	return String(str ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}
