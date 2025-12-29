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
            <span class="pill">
              ${icon ? `<img class="storeIcon" src="${icon}" alt="" />` : ""}
              ${escapeHtml(sName)}
            </span>
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
