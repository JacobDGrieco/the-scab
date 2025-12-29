import "./style.css";

import { apiGet } from "./lib/api.js";
import { state } from "./state.js";
import { renderLayout } from "./views/layout.js";
import { getRoute, nav } from "./router.js";
import { renderDealsView } from "./views/deals.js";
import { renderSearchView } from "./views/search.js";
import { renderGameView } from "./views/game.js";

function setActiveTab(tab) {
	document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
	const btn = document.querySelector(`.tab[data-tab="${tab}"]`);
	if (btn) btn.classList.add("active");
}

async function render() {
	const [first, second] = getRoute(); // ex: ["game", "123"]

	if (first === "deals") {
		setActiveTab("deals");
		renderDealsView();
		return;
	}

	if (first === "search") {
		setActiveTab("search");
		renderSearchView();
		return;
	}

	if (first === "game") {
		// no tab highlight for details page
		document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
		await renderGameView(second);
		return;
	}

	// fallback
	nav("/deals");
}

async function bootstrap() {
	renderLayout();

	// top tabs navigate pages
	document.querySelectorAll(".tab").forEach((btn) => {
		btn.addEventListener("click", () => {
			const tab = btn.dataset.tab;
			nav(`/${tab}`);
		});
	});

	// load stores once
	try {
		const storeData = await apiGet("/api/stores");
		state.stores = storeData.stores || {};
	} catch {
		state.stores = {};
	}

	window.addEventListener("hashchange", render);

	// default route if blank
	if (!window.location.hash) nav("/deals");
	await render();
}

bootstrap();
