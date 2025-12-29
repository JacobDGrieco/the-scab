import { $ } from "../lib/dom.js";

export function renderLayout() {
	$("#app").innerHTML = `
    <div class="container">
      <div class="header">
        <div class="brand">
          <div class="logo"></div>
          <div>
            <h1>SCAB</h1>
            <p class="muted">Search & compare prices across stores (powered by CheapShark)</p>
          </div>
        </div>

        <div class="tabs">
          <button class="tab" data-tab="deals">Deals</button>
          <button class="tab" data-tab="search">Search</button>
        </div>
      </div>

      <div class="panel">
        <div id="view"></div>
      </div>
    </div>
  `;
}
