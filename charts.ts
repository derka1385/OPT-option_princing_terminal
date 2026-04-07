import type { OptionParams, MonteCarloResult } from "./types";
import { blackScholes } from "./pricing";

type ChartPoint = { x: number; y: number };

function getCanvas(id: string): HTMLCanvasElement | null {
  return document.getElementById(id) as HTMLCanvasElement | null;
}

function clearCanvas(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, w, h);
}

function drawAxes(
  ctx: CanvasRenderingContext2D,
  pad: { l: number; r: number; t: number; b: number },
  w: number,
  h: number
): void {
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t);
  ctx.lineTo(pad.l, h - pad.b);
  ctx.lineTo(w - pad.r, h - pad.b);
  ctx.stroke();
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  pad: { l: number; r: number; t: number; b: number },
  w: number,
  h: number,
  nx: number,
  ny: number
): void {
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 0.5;
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  for (let i = 1; i <= nx; i++) {
    const x = pad.l + (i / nx) * innerW;
    ctx.beginPath();
    ctx.moveTo(x, pad.t);
    ctx.lineTo(x, h - pad.b);
    ctx.stroke();
  }
  for (let i = 1; i <= ny; i++) {
    const y = pad.t + (i / ny) * innerH;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(w - pad.r, y);
    ctx.stroke();
  }
}

export function renderPayoffChart(params: OptionParams, bsPrice: number): void {
  const canvas = getCanvas("payoffChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d")!;
  const w = canvas.width;
  const h = canvas.height;
  const pad = { l: 55, r: 20, t: 20, b: 40 };

  clearCanvas(ctx, w, h);
  drawGrid(ctx, pad, w, h, 8, 5);
  drawAxes(ctx, pad, w, h);

  const sMin = params.S * 0.5;
  const sMax = params.S * 1.5;
  const nPoints = 200;

  const payoffPoints: ChartPoint[] = [];
  const plPoints: ChartPoint[] = [];

  for (let i = 0; i <= nPoints; i++) {
    const s = sMin + (i / nPoints) * (sMax - sMin);
    const payoff =
      params.type === "call"
        ? Math.max(s - params.K, 0)
        : Math.max(params.K - s, 0);
    const pl = payoff - bsPrice;
    payoffPoints.push({ x: s, y: payoff });
    plPoints.push({ x: s, y: pl });
  }

  const allY = [...payoffPoints.map((p) => p.y), ...plPoints.map((p) => p.y)];
  const yMin = Math.min(...allY);
  const yMax = Math.max(...allY);
  const yRange = yMax - yMin || 1;

  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;

  const toX = (s: number) => pad.l + ((s - sMin) / (sMax - sMin)) * innerW;
  const toY = (y: number) => h - pad.b - ((y - yMin) / yRange) * innerH;

  // Zero line
  const y0 = toY(0);
  ctx.strokeStyle = "#333";
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(pad.l, y0);
  ctx.lineTo(w - pad.r, y0);
  ctx.stroke();
  ctx.setLineDash([]);

  // Strike line
  const xK = toX(params.K);
  ctx.strokeStyle = "#444";
  ctx.setLineDash([2, 4]);
  ctx.beginPath();
  ctx.moveTo(xK, pad.t);
  ctx.lineTo(xK, h - pad.b);
  ctx.stroke();
  ctx.setLineDash([]);

  // P&L curve
  ctx.strokeStyle = "#ff4444";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  plPoints.forEach((p, i) => {
    if (i === 0) ctx.moveTo(toX(p.x), toY(p.y));
    else ctx.lineTo(toX(p.x), toY(p.y));
  });
  ctx.stroke();

  // Payoff curve
  ctx.strokeStyle = "#00ff88";
  ctx.lineWidth = 2;
  ctx.beginPath();
  payoffPoints.forEach((p, i) => {
    if (i === 0) ctx.moveTo(toX(p.x), toY(p.y));
    else ctx.lineTo(toX(p.x), toY(p.y));
  });
  ctx.stroke();

  // Spot marker
  const xS = toX(params.S);
  ctx.strokeStyle = "#00aaff";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(xS, pad.t);
  ctx.lineTo(xS, h - pad.b);
  ctx.stroke();
  ctx.setLineDash([]);

  // Labels
  ctx.fillStyle = "#555";
  ctx.font = "10px monospace";
  ctx.fillText(`K=${params.K}`, xK + 3, pad.t + 12);
  ctx.fillStyle = "#00aaff";
  ctx.fillText(`S=${params.S}`, xS + 3, pad.t + 24);

  // Y axis labels
  ctx.fillStyle = "#555";
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const y = yMin + (i / 4) * yRange;
    ctx.fillText(y.toFixed(1), pad.l - 5, toY(y) + 4);
  }
  ctx.textAlign = "left";
}

export function renderDistributionChart(
  finalPrices: number[],
  K: number
): void {
  const canvas = getCanvas("distChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d")!;
  const w = canvas.width;
  const h = canvas.height;
  const pad = { l: 45, r: 20, t: 20, b: 40 };

  clearCanvas(ctx, w, h);

  if (!finalPrices.length) return;

  const sorted = [...finalPrices].sort((a, b) => a - b);
  const pMin = sorted[0];
  const pMax = sorted[sorted.length - 1];
  const nBins = 60;
  const binSize = (pMax - pMin) / nBins;
  const bins = new Array(nBins).fill(0);

  finalPrices.forEach((p) => {
    const idx = Math.min(Math.floor((p - pMin) / binSize), nBins - 1);
    bins[idx]++;
  });

  const maxBin = Math.max(...bins);
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;

  drawGrid(ctx, pad, w, h, 8, 5);
  drawAxes(ctx, pad, w, h);

  const binW = innerW / nBins;

  bins.forEach((count, i) => {
    const binStart = pMin + i * binSize;
    const barH = (count / maxBin) * innerH;
    const x = pad.l + i * binW;
    const y = h - pad.b - barH;
    const isITM = binStart >= K;
    ctx.fillStyle = isITM ? "rgba(0,255,136,0.6)" : "rgba(255,68,68,0.4)";
    ctx.fillRect(x, y, binW - 0.5, barH);
  });

  // Strike line
  const xK = pad.l + ((K - pMin) / (pMax - pMin)) * innerW;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(xK, pad.t);
  ctx.lineTo(xK, h - pad.b);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#888";
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`K=${K}`, xK + 3, pad.t + 12);

  // X axis
  ctx.fillStyle = "#555";
  ctx.textAlign = "center";
  for (let i = 0; i <= 4; i++) {
    const v = pMin + (i / 4) * (pMax - pMin);
    const x = pad.l + (i / 4) * innerW;
    ctx.fillText(v.toFixed(0), x, h - pad.b + 14);
  }
}

export function renderVolChart(params: OptionParams): void {
  const canvas = getCanvas("volChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d")!;
  const w = canvas.width;
  const h = canvas.height;
  const pad = { l: 55, r: 20, t: 20, b: 40 };

  clearCanvas(ctx, w, h);
  drawGrid(ctx, pad, w, h, 8, 5);
  drawAxes(ctx, pad, w, h);

  const sigmaMin = 0.01;
  const sigmaMax = 1.0;
  const nPoints = 200;
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;

  const prices: number[] = [];
  for (let i = 0; i <= nPoints; i++) {
    const sig = sigmaMin + (i / nPoints) * (sigmaMax - sigmaMin);
    prices.push(blackScholes(params.S, params.K, params.T, params.r, sig, params.q, params.type).price);
  }

  const pMin = Math.min(...prices);
  const pMax = Math.max(...prices);
  const pRange = pMax - pMin || 1;

  const toX = (sig: number) =>
    pad.l + ((sig - sigmaMin) / (sigmaMax - sigmaMin)) * innerW;
  const toY = (p: number) =>
    h - pad.b - ((p - pMin) / pRange) * innerH;

  ctx.strokeStyle = "#00aaff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= nPoints; i++) {
    const sig = sigmaMin + (i / nPoints) * (sigmaMax - sigmaMin);
    const x = toX(sig);
    const y = toY(prices[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Current sigma marker
  const xSig = toX(params.sigma);
  ctx.strokeStyle = "#00ff88";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(xSig, pad.t);
  ctx.lineTo(xSig, h - pad.b);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#555";
  ctx.font = "10px monospace";
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const p = pMin + (i / 4) * pRange;
    ctx.fillText(p.toFixed(2), pad.l - 5, toY(p) + 4);
  }
  ctx.textAlign = "center";
  for (let i = 0; i <= 4; i++) {
    const s = sigmaMin + (i / 4) * (sigmaMax - sigmaMin);
    ctx.fillText((s * 100).toFixed(0) + "%", toX(s), h - pad.b + 14);
  }
  ctx.textAlign = "left";
}

export function renderSpotChart(params: OptionParams): void {
  const canvas = getCanvas("spotChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d")!;
  const w = canvas.width;
  const h = canvas.height;
  const pad = { l: 55, r: 20, t: 20, b: 40 };

  clearCanvas(ctx, w, h);
  drawGrid(ctx, pad, w, h, 8, 5);
  drawAxes(ctx, pad, w, h);

  const sMin = params.S * 0.5;
  const sMax = params.S * 1.5;
  const nPoints = 200;
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;

  const prices: number[] = [];
  for (let i = 0; i <= nPoints; i++) {
    const s = sMin + (i / nPoints) * (sMax - sMin);
    prices.push(blackScholes(s, params.K, params.T, params.r, params.sigma, params.q, params.type).price);
  }

  const pMin = Math.min(...prices);
  const pMax = Math.max(...prices);
  const pRange = pMax - pMin || 1;

  const toX = (s: number) =>
    pad.l + ((s - sMin) / (sMax - sMin)) * innerW;
  const toY = (p: number) =>
    h - pad.b - ((p - pMin) / pRange) * innerH;

  ctx.strokeStyle = "#ffaa00";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= nPoints; i++) {
    const s = sMin + (i / nPoints) * (sMax - sMin);
    if (i === 0) ctx.moveTo(toX(s), toY(prices[i]));
    else ctx.lineTo(toX(s), toY(prices[i]));
  }
  ctx.stroke();

  // Current spot marker
  const xS = toX(params.S);
  ctx.strokeStyle = "#00aaff";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(xS, pad.t);
  ctx.lineTo(xS, h - pad.b);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#555";
  ctx.font = "10px monospace";
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const p = pMin + (i / 4) * pRange;
    ctx.fillText(p.toFixed(2), pad.l - 5, toY(p) + 4);
  }
  ctx.textAlign = "center";
  for (let i = 0; i <= 4; i++) {
    const s = sMin + (i / 4) * (sMax - sMin);
    ctx.fillText(s.toFixed(0), toX(s), h - pad.b + 14);
  }
  ctx.textAlign = "left";
}