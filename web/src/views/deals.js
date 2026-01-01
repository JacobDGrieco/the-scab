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

function purchaseType(/* deal */) {
	// CheapShark is PC-only and deals are digital keys for now.
	return "Digital";
}

function platformBadges(storeID) {
	const name = storeName(storeID).toLowerCase();
	const badges = [];

	// Platform (CheapShark is PC-only)
	badges.push({ key: "pc", label: "PC", icon: "🖥️" });

	// Library / launcher (best-effort by store name)
	if (name.includes("steam")) badges.push({ key: "steam", label: "Steam", svg: STEAM_SVG });
	if (name.includes("epic")) badges.push({ key: "epic", label: "Epic", svg: EPIC_SVG });
	if (name.includes("gog")) badges.push({ key: "gog", label: "GOG", svg: GOG_SVG });

	return badges;
}

function renderBadges(storeID) {
	return platformBadges(storeID)
		.map((b) => `
      <span class="chip" title="${escapeHtml(b.label)}">
        ${b.svg ? `<span class="chipSvg">${b.svg}</span>` : `<span class="chipEmoji">${escapeHtml(b.icon || "")}</span>`}
        <span class="chipText">${escapeHtml(b.label)}</span>
      </span>
    `)
		.join("");
}

// Tiny inline SVGs (monochrome)
const STEAM_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.7 13.2a3.3 3.3 0 1 0-3.1-4.6l-4.7 3a3 3 0 0 0-3.7 1.3l-1 .4 1.4 3.4 1-.4a3 3 0 0 0 3.5 1.6l4.8 2a3.3 3.3 0 0 0 2.8-4.7zm0-6a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4zM7.4 17.4a1.9 1.9 0 1 1 0-3.8 1.9 1.9 0 0 1 0 3.8zm7.3-.6-4.3-1.8a3 3 0 0 0 .1-1.4l4.2-2.7a3.3 3.3 0 0 0 2.8 2.1 3.3 3.3 0 0 0 .9-.1 2.2 2.2 0 0 1-3.7 3.9z"/></svg>`;
const EPIC_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10l1 2v9l-6 7-6-7V5l1-2zm2 3v2h6V6H9zm0 4v2h6v-2H9zm0 4v2h4v-2H9z"/></svg>`;
const GOG_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h10v4H7V5zm-2 6h14v8H5v-8zm2 2v4h10v-4H7z"/></svg>`;

function dealCard(d) {
	const sName = storeName(d.storeID);
	const icon = storeIcon(d.storeID);
	const savings = d.savings != null ? pct(d.savings) : null;

	// CheapShark deals include gameID, but just in case:
	const gameID =
		d.gameID != null ? String(d.gameID) :
			d.gameId != null ? String(d.gameId) :
				"";


	return `
    <div class="card">
      <a class="thumbLink" href="${d.url}" target="_blank" rel="noreferrer" aria-label="Open deal">
        <img class="thumb" src="${d.thumb || ""}" alt="" loading="lazy"/>
      </a>

      <div class="cardBody">
        <div class="title">${escapeHtml(d.title)}</div>

        <div class="meta">
          <div>
            <div class="price">${money(d.salePrice)}</div>
            <div class="muted2" style="font-size:12px;">was ${money(d.normalPrice)}</div>
          </div>
          <div style="text-align:right;">
  <div class="pillRow">
    <span class="pill">
      ${icon ? `<img class="storeIcon" src="${icon}" alt="" />` : ""}
      ${escapeHtml(sName)}
    </span>
    <span class="pill" title="Purchase type">
      💾 ${escapeHtml(purchaseType(d))}
    </span>
  </div>
  <div class="savings" style="margin-top:6px;">${savings ?? ""}</div>
</div>
        </div>
        <div class="cardActions">
          <button class="btn btnFull" data-view-game="${gameID ?? ""}" ${gameID ? "" : "disabled"}>
            View all stores
          </button>
        </div>
      </div>
    </div>
  `;
}

export function renderDealsView() {
	const view = $("#view");
	view.innerHTML = `
    <div class="panelHeader">
      <div class="row">
        <span class="pill">Browse current deals</span>
        <span class="muted2" id="dealStatus">Loading…</span>
      </div>

      <div class="row" style="padding-top:0;">
        <select class="select" id="storeSelect">
          <option value="">All stores</option>
        </select>

        <input class="smallInput" id="upperPrice" type="number" step="1" min="0" placeholder="Max price (e.g. 20)" />
        <button class="btn" id="refreshDeals">Refresh</button>
      </div>
    </div>

    <div class="grid" id="dealGrid"></div>
  `;

	const sel = $("#storeSelect");
	const upper = $("#upperPrice");

	if (state.stores) {
		const opts = Object.values(state.stores)
			.filter((s) => s.isActive)
			.sort((a, b) => a.name.localeCompare(b.name))
			.map((s) => `<option value="${s.storeID}">${s.name}</option>`)
			.join("");
		sel.insertAdjacentHTML("beforeend", opts);
	}

	async function loadDeals() {
		$("#dealStatus").textContent = "Loading…";
		$("#dealGrid").innerHTML = "";

		const storeID = sel.value.trim();
		const upperPrice = upper.value.trim();

		const params = new URLSearchParams();
		params.set("limit", "24");
		if (storeID) params.set("storeID", storeID);
		if (upperPrice) params.set("upperPrice", upperPrice);

		try {
			const data = await apiGet(`/api/deals?${params.toString()}`);
			$("#dealStatus").textContent = `Showing ${data.count} deals`;
			$("#dealGrid").innerHTML = data.items.map(dealCard).join("");
			document.querySelectorAll("#dealGrid [data-view-game]").forEach((btn) => {
				btn.addEventListener("click", () => {
					const gameID = btn.getAttribute("data-view-game");
					if (gameID) nav(`/game/${gameID}`);
				});
			});
		} catch (e) {
			$("#dealStatus").textContent = `Error: ${e.message}`;
		}
	}

	$("#refreshDeals").addEventListener("click", loadDeals);
	sel.addEventListener("change", loadDeals);

	loadDeals();
}
