import { $ } from "../lib/dom.js";
import { apiGet } from "../lib/api.js";
import { money, escapeHtml } from "../lib/format.js";
import { nav } from "../router.js";

function gameCard(g) {
	// Shows lowest price (cheapest) AND a button to navigate to details page
	return `
    <div class="card">
      <img class="thumb" src="${g.thumb || ""}" alt="" loading="lazy"/>
      <div class="cardBody">
        <div class="title">${escapeHtml(g.title)}</div>

        <div class="meta">
          <div>
            <div class="price">${g.cheapest != null ? money(g.cheapest) : "—"}</div>
            <div class="muted2" style="font-size:12px;">lowest price found</div>
          </div>
        </div>

        <div class="cardActions">
          <button class="btn btnFull" data-view-game="${g.gameID}">View all stores</button>
        </div>
      </div>
    </div>
  `;
}

export function renderSearchView() {
	const view = $("#view");
	view.innerHTML = `
    <div class="panelHeader">
      <div class="row">
        <div class="input" style="flex: 1 1 520px;">
          <span class="muted2">🔎</span>
          <input id="q" placeholder="Search games (example: Elden Ring, Hades, Hollow Knight)" />
        </div>

        <select class="select" id="limit">
          <option value="12">12 results</option>
          <option value="24">24 results</option>
          <option value="36">36 results</option>
          <option value="60">60 results</option>
        </select>

        <button class="btn" id="doSearch">Search</button>
        <span class="muted2" id="searchStatus"></span>
      </div>
    </div>

    <div class="grid" id="searchGrid"></div>
  `;

	const q = $("#q");
	const limit = $("#limit");
	const status = $("#searchStatus");
	const grid = $("#searchGrid");

	async function run() {
		const query = q.value.trim();
		if (!query) return;

		status.textContent = "Searching…";
		grid.innerHTML = "";

		try {
			const data = await apiGet(
				`/api/search?q=${encodeURIComponent(query)}&limit=${encodeURIComponent(limit.value)}`
			);
			status.textContent = `Found ${data.count}`;
			grid.innerHTML = data.items.map(gameCard).join("");

			// Wire buttons
			grid.querySelectorAll("[data-view-game]").forEach((btn) => {
				btn.addEventListener("click", () => {
					nav(`/game/${btn.getAttribute("data-view-game")}`);
				});
			});
		} catch (e) {
			status.textContent = `Error: ${e.message}`;
		}
	}

	$("#doSearch").addEventListener("click", run);
	q.addEventListener("keydown", (e) => {
		if (e.key === "Enter") run();
	});
}
