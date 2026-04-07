import type { OptionParams, PricingResult } from "./types";
import { blackScholes } from "./pricing";
import { computeGreeks } from "./greeks";
import { runMonteCarlo } from "./monteCarlo";
import { impliedVol } from "./impliedVol";
import { validateParams } from "./validation";
import {
  renderPayoffChart,
  renderDistributionChart,
  renderVolChart,
  renderSpotChart,
} from "./charts";

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function getNum(id: string): number {
  return parseFloat((el<HTMLInputElement>(id)).value);
}

function getString(id: string): string {
  return (el<HTMLInputElement>(id)).value.trim();
}

export function getParams(): OptionParams {
  const typeEl = document.querySelector<HTMLInputElement>(
    'input[name="optionType"]:checked'
  );
  return {
    S: getNum("inputS"),
    K: getNum("inputK"),
    T: getNum("inputT"),
    r: getNum("inputR") / 100,
    sigma: getNum("inputSigma") / 100,
    q: getNum("inputQ") / 100,
    type: (typeEl?.value ?? "call") as "call" | "put",
    N: Math.round(getNum("inputN")),
    steps: Math.round(getNum("inputSteps")),
    seed: getString("inputSeed") ? parseInt(getString("inputSeed")) : undefined,
    marketPrice: getString("inputMarketPrice")
      ? parseFloat(getString("inputMarketPrice"))
      : undefined,
  };
}

function fmt(n: number, digits = 4): string {
  return isFinite(n) ? n.toFixed(digits) : "—";
}

function fmtPct(n: number): string {
  return isFinite(n) ? (n * 100).toFixed(2) + "%" : "—";
}

export function renderResults(result: PricingResult): void {
  const { bs, greeks, mc, impliedVol: iv } = result;

  const setVal = (id: string, val: string) => {
    const el2 = document.getElementById(id);
    if (el2) el2.textContent = val;
  };

  setVal("outBSPrice", fmt(bs.price));
  setVal("outMCPrice", fmt(mc.price));
  setVal("outMCError", `±${fmt(mc.stdError)}`);
  setVal("outD1", fmt(bs.d1));
  setVal("outD2", fmt(bs.d2));
  setVal("outDelta", fmt(greeks.delta));
  setVal("outGamma", fmt(greeks.gamma));
  setVal("outTheta", fmt(greeks.theta));
  setVal("outVega", fmt(greeks.vega / 100));
  setVal("outRho", fmt(greeks.rho));
  setVal("outIV", iv !== undefined && iv !== null ? fmtPct(iv) : "—");
  setVal("outMarketPrice", result.params.marketPrice !== undefined ? fmt(result.params.marketPrice) : "—");

  renderPayoffChart(result.params, bs.price);
  renderDistributionChart(mc.finalPrices, result.params.K);
  renderVolChart(result.params);
  renderSpotChart(result.params);
}

export function runPricing(): void {
  const statusEl = el<HTMLElement>("status");
  const resultsEl = el<HTMLElement>("resultsPanel");

  const params = getParams();
  const validation = validateParams(params);

  if (!validation.valid) {
    statusEl.textContent = "ERROR: " + validation.errors.join(" | ");
    statusEl.style.color = "#ff4444";
    return;
  }

  statusEl.textContent = "COMPUTING...";
  statusEl.style.color = "#ffaa00";

  setTimeout(() => {
    try {
      const bs = blackScholes(params.S, params.K, params.T, params.r, params.sigma, params.q, params.type);
      const greeks = computeGreeks(params.S, params.K, params.T, params.r, params.sigma, params.q, params.type);
      const mc = runMonteCarlo(
        params.S, params.K, params.T, params.r, params.sigma, params.q,
        params.type, params.N, params.steps, params.seed
      );
      const iv =
        params.marketPrice !== undefined
          ? impliedVol(params.marketPrice, params.S, params.K, params.T, params.r, params.q, params.type) ?? undefined
          : undefined;

      const result: PricingResult = { bs, greeks, mc, impliedVol: iv, params };
      renderResults(result);

      resultsEl.style.display = "block";
      statusEl.textContent = "DONE";
      statusEl.style.color = "#00ff88";
    } catch (e) {
      statusEl.textContent = "ERROR: " + (e as Error).message;
      statusEl.style.color = "#ff4444";
    }
  }, 10);
}

export function switchTab(tabName: string): void {
  document.querySelectorAll<HTMLElement>(".tab-panel").forEach((p) => {
    p.style.display = "none";
  });
  document.querySelectorAll<HTMLElement>(".tab-btn").forEach((b) => {
    b.classList.remove("active");
  });
  const panel = document.getElementById(`tab-${tabName}`);
  if (panel) panel.style.display = "block";
  const btn = document.querySelector<HTMLElement>(`[data-tab="${tabName}"]`);
  if (btn) btn.classList.add("active");
}