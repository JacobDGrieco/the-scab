export function nav(hash) {
	if (!hash.startsWith("#")) hash = "#" + hash;
	window.location.hash = hash;
}

export function getRoute() {
	const h = (window.location.hash || "#/deals").replace(/^#/, "");
	const parts = h.split("/").filter(Boolean); // ["deals"] or ["game", "123"]
	return parts.length ? parts : ["deals"];
}
