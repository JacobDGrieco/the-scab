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
            <th>Price</th>
            <th>Retail</th>
            <th>Savings</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="5" class="muted">No deals found.</td></tr>`}
        </tbody>
      </table>
    `;
	} catch (e) {
		$("#gameStatus").textContent = "Error";
		$("#gameBody").innerHTML = `<div class="muted">Failed to load game: ${escapeHtml(e.message)}</div>`;
	}
}
