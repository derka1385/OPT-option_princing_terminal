import type { MonteCarloResult, OptionType } from "./types";

export function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function boxMuller(rand: () => number): number {
  const u1 = Math.max(rand(), 1e-10);
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function runMonteCarlo(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  q: number,
  type: OptionType,
  N: number,
  steps: number,
  seed?: number
): MonteCarloResult {
  const rand = seed !== undefined ? seededRandom(seed) : Math.random;
  const dt = T / steps;
  const drift = (r - q - 0.5 * sigma * sigma) * dt;
  const diffusion = sigma * Math.sqrt(dt);
  const df = Math.exp(-r * T);

  const maxPathsToStore = Math.min(N, 200);
  const paths: number[][] = Array.from({ length: maxPathsToStore }, () => [S]);
  const finalPrices: number[] = [];

  let sumPayoff = 0;
  let sumPayoff2 = 0;

  for (let i = 0; i < N; i++) {
    let spot = S;
    const storePath = i < maxPathsToStore;
    for (let j = 0; j < steps; j++) {
      const z = boxMuller(rand);
      spot *= Math.exp(drift + diffusion * z);
      if (storePath) paths[i].push(spot);
    }

    const payoff =
      type === "call"
        ? Math.max(spot - K, 0)
        : Math.max(K - spot, 0);

    sumPayoff += payoff;
    sumPayoff2 += payoff * payoff;
    finalPrices.push(spot);
  }

  const meanPayoff = sumPayoff / N;
  const variance = sumPayoff2 / N - meanPayoff * meanPayoff;
  const stdError = (Math.sqrt(variance / N)) * df;
  const price = meanPayoff * df;

  return { price, stdError, paths, finalPrices };
}
