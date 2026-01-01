import { $ } from "../lib/dom.js";
import { apiGet } from "../lib/api.js";
import { money, pct, escapeHtml } from "../lib/format.js";
import { state } from "../state.js";
import { nav } from "../router.js";

function storeName(storeID) {
	return state.stores?.[String(storeID)]?.name ?? `Store ${storeID}`;
}
function storeIcon(storeID) {
	return state.stores?.[String(storeID)]?.images?.icon ?? null;
}

function purchaseType(/* deal */) {
	// CheapShark is PC-only and deals are digital keys for now.
	return "Digital";
}

// "Where things go" (redeem destination / library)
// You can expand this mapping as you add more stores.
function storeDestinations(storeID) {
	const name = storeName(storeID).toLowerCase();

	// Explicit "this store sells keys for X"
	// Examples you asked for:
	if (name.includes("humble")) return ["steam"]; // Humble: mostly Steam keys

	// Store is the library itself
	if (name.includes("steam")) return ["steam"];
	if (name.includes("gog")) return ["gog"];
	if (name.includes("epic")) return ["epic"];

	// Common key resellers (usually Steam keys)
	if (name.includes("fanatical")) return ["steam"];
	if (name.includes("green man")) return ["steam"];
	if (name.includes("gamebillet")) return ["steam"];
	if (name.includes("wingamestore")) return ["steam"];

	// Unknown / mixed
	return [];
}

function renderDestinations(storeID) {
	const libs = storeDestinations(storeID);
	if (!libs.length) return "—";
	return libs
		.map((k) => {
			const { label, svg } = LIB_ICONS[k] || { label: k.toUpperCase(), svg: "" };
			return `
        <span class="chip" title="${escapeHtml(label)}">
          <span class="chipSvg">${svg}</span>
          <span class="chipText">${escapeHtml(label)}</span>
        </span>
      `;
		})
		.join("");
}

// Tiny inline SVGs (monochrome)
const LIB_ICONS = {
	steam: {
		label: "Steam",
		svg: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.7 13.2a3.3 3.3 0 1 0-3.1-4.6l-4.7 3a3 3 0 0 0-3.7 1.3l-1 .4 1.4 3.4 1-.4a3 3 0 0 0 3.5 1.6l4.8 2a3.3 3.3 0 0 0 2.8-4.7zm0-6a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4zM7.4 17.4a1.9 1.9 0 1 1 0-3.8 1.9 1.9 0 0 1 0 3.8zm7.3-.6-4.3-1.8a3 3 0 0 0 .1-1.4l4.2-2.7a3.3 3.3 0 0 0 2.8 2.1 3.3 3.3 0 0 0 .9-.1 2.2 2.2 0 0 1-3.7 3.9z"/></svg>`,
	},
	epic: {
		label: "Epic",
		svg: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10l1 2v9l-6 7-6-7V5l1-2zm2 3v2h6V6H9zm0 4v2h6v-2H9zm0 4v2h4v-2H9z"/></svg>`,
	},
	gog: {
		label: "GOG",
		svg: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h10v4H7V5zm-2 6h14v8H5v-8zm2 2v4h10v-4H7z"/></svg>`,
	},
};


export async function renderGameView(gameID) {
	const view = $("#view");
	view.innerHTML = `
    <div class="panelHeader">
      <div class="row">
        <button class="btn" id="backBtn">← Back</button>
        <span class="muted2" id="gameStatus">Loading…</span>
      </div>
    </div>
    <div class="tableWrap" id="gameBody"></div>
  `;

	$("#backBtn").addEventListener("click", () => {
		// You can change this to remember last page later
		nav("/search");
	});

	try {
		const g = await apiGet(`/api/game/${encodeURIComponent(gameID)}`);

		$("#gameStatus").textContent = g.title ? g.title : `Game ${gameID}`;

		const rows = (g.deals || [])
			.slice()
			.sort((a, b) => (a.price ?? 999999) - (b.price ?? 999999))
			.map((d) => {
				const icon = storeIcon(d.storeID);
				const name = storeName(d.storeID);
				const savings = d.savings != null ? pct(d.savings) : "—";

				return `
				<tr>
				<td>
					<div class="storeCell">
					${icon ? `<img class="storeIcon" src="${icon}" alt="" />` : ""}
					<div>${escapeHtml(name)}</div>
					</div>
				</td>
				<td><div class="chips">${renderDestinations(d.storeID)}</div></td>
				<td>${purchaseType(d)}</td>
				<td>${money(d.price)}</td>
				<td>${money(d.retailPrice)}</td>
				<td class="savings">${savings}</td>
				<td><a href="${d.url}" target="_blank" rel="noreferrer">Open deal</a></td>
				</tr>
        `;
			})
			.join("");

		$("#gameBody").innerHTML = `
      <div class="gameHeader">
        ${g.thumb ? `<img class="gameThumb" src="${g.thumb}" alt="" />` : ""}
        <div>
          <div class="gameTitle">${escapeHtml(g.title || "Game")}</div>
          <div class="muted2">Game ID: ${escapeHtml(gameID)}</div>
        </div>
      </div>

      <table>
        <thead>
		<tr>
			<th>Store</th>
			<th>Where</th>
			<th>Type</th>
			<th>Price</th>
			<th>Retail</th>
			<th>Savings</th>
			<th>Link</th>
		</tr>
		</thead>
        <tbody>
          ${rows || `<tr><td colspan="7" class="muted">No deals found.</td></tr>`}
        </tbody>
      </table>
    `;
	} catch (e) {
		$("#gameStatus").textContent = "Error";
		$("#gameBody").innerHTML = `<div class="muted">Failed to load game: ${escapeHtml(e.message)}</div>`;
	}
}
