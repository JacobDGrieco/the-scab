import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT || 5179);
const BASE = "https://www.cheapshark.com/api/1.0";

function clamp(n, min, max) {
	return Math.min(Math.max(n, min), max);
}

async function fetchJson(url) {
	const resp = await fetch(url);
	const text = await resp.text();
	if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${text}`);
	return JSON.parse(text);
}

/**
 * CheapShark store redirect rule: when sending users to deals,
 * use: https://www.cheapshark.com/redirect?dealID=XXXX :contentReference[oaicite:3]{index=3}
 */
function dealRedirect(dealID) {
	return `https://www.cheapshark.com/redirect?dealID=${dealID}`;
}

app.get("/api/health", (req, res) => {
	res.json({ ok: true, source: "cheapshark", port: PORT });
});

/**
 * Stores (for UI filters + logos)
 * GET https://www.cheapshark.com/api/1.0/stores :contentReference[oaicite:4]{index=4}
 */
app.get("/api/stores", async (req, res) => {
	try {
		const data = await fetchJson(`${BASE}/stores`);

		// Normalize into a map you can use everywhere
		const stores = Object.fromEntries(
			data.map((s) => [
				String(s.storeID),
				{
					storeID: String(s.storeID),
					name: s.storeName,
					isActive: s.isActive === 1,
					// Images are relative paths in CheapShark; prefix with cheapshark domain
					images: s.images
						? {
							banner: `https://www.cheapshark.com${s.images.banner}`,
							logo: `https://www.cheapshark.com${s.images.logo}`,
							icon: `https://www.cheapshark.com${s.images.icon}`,
						}
						: null,
				},
			])
		);

		res.json({ stores });
	} catch (err) {
		res.status(500).json({ error: String(err?.message || err) });
	}
});

/**
 * Search games by title
 * GET /games?title=...&limit=...
 * Docs: CheapShark API :contentReference[oaicite:5]{index=5}
 */
app.get("/api/search", async (req, res) => {
	try {
		const q = String(req.query.q || "").trim();
		const limit = clamp(Number(req.query.limit || 12), 1, 60);

		if (!q) return res.status(400).json({ error: "Missing query param: q" });

		const url = new URL(`${BASE}/games`);
		url.searchParams.set("title", q);
		url.searchParams.set("limit", String(limit));

		const data = await fetchJson(url.toString());

		const items = data.map((g) => ({
			gameID: String(g.gameID),
			title: g.external,
			cheapest: g.cheapest ? Number(g.cheapest) : null,
			cheapestDealID: g.cheapestDealID || null,
			// For UI: clicking should go through CheapShark redirect if deal exists
			url: g.cheapestDealID ? dealRedirect(g.cheapestDealID) : null,
			thumb: g.thumb || null,
			source: "cheapshark",
		}));

		res.json({ q, count: items.length, items });
	} catch (err) {
		res.status(500).json({ error: String(err?.message || err) });
	}
});

/**
 * Game details + all active deals for that game
 * GET /games?id=GAME_ID
 * Docs: CheapShark API :contentReference[oaicite:6]{index=6}
 */
app.get("/api/game/:gameID", async (req, res) => {
	try {
		const gameID = String(req.params.gameID || "").trim();
		if (!gameID) return res.status(400).json({ error: "Missing gameID" });

		const url = new URL(`${BASE}/games`);
		url.searchParams.set("id", gameID);

		const data = await fetchJson(url.toString());

		// Expected shape includes info + deals
		const info = data.info || {};
		const deals = (data.deals || []).map((d) => ({
			dealID: String(d.dealID),
			storeID: String(d.storeID),
			price: d.price ? Number(d.price) : null,
			retailPrice: d.retailPrice ? Number(d.retailPrice) : null,
			savings: d.savings ? Number(d.savings) : null,
			url: dealRedirect(d.dealID),
		}));

		res.json({
			gameID,
			title: info.title || null,
			steamAppID: info.steamAppID ? String(info.steamAppID) : null,
			thumb: info.thumb || null,
			deals,
		});
	} catch (err) {
		res.status(500).json({ error: String(err?.message || err) });
	}
});

/**
 * Browse deals (home page / “today’s deals”)
 * GET /deals?pageNumber=...&pageSize=...&storeID=...&upperPrice=... etc
 * Docs: CheapShark API :contentReference[oaicite:7]{index=7}
 */
app.get("/api/deals", async (req, res) => {
	try {
		const page = clamp(Number(req.query.page || 0), 0, 50);
		const limit = clamp(Number(req.query.limit || 20), 1, 60);

		const storeID = req.query.storeID ? String(req.query.storeID) : null;
		const upperPrice = req.query.upperPrice ? String(req.query.upperPrice) : null;

		const url = new URL(`${BASE}/deals`);
		url.searchParams.set("pageNumber", String(page));
		url.searchParams.set("pageSize", String(limit));
		if (storeID) url.searchParams.set("storeID", storeID);
		if (upperPrice) url.searchParams.set("upperPrice", upperPrice);

		const data = await fetchJson(url.toString());

		const items = data.map((d) => ({
			dealID: String(d.dealID),
			gameID: String(d.gameID),
			title: d.title,
			storeID: String(d.storeID),
			salePrice: d.salePrice ? Number(d.salePrice) : null,
			normalPrice: d.normalPrice ? Number(d.normalPrice) : null,
			savings: d.savings ? Number(d.savings) : null,
			thumb: d.thumb || null,
			url: dealRedirect(d.dealID),
		}));


		res.json({ page, count: items.length, items });
	} catch (err) {
		res.status(500).json({ error: String(err?.message || err) });
	}
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
