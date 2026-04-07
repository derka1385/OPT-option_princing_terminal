/**
 * monteCarlo.ts — Simulation GBM sous mesure risque-neutre Q
 *
 * Discrétisation exacte du GBM (Euler–Maruyama est exact pour GBM log-normal) :
 *   S(t+dt) = S(t) · exp[(r - q - ½σ²)dt + σ√dt · Z]   Z ~ N(0,1)
 *
 * Réduction de variance :
 *   - Antithetic variates : chaque tirage Z est couplé avec -Z
 *     → réduit la variance de l'estimateur de ~50% à coût nul
 *
 * Actualisation : e^(-rT) sous mesure risque-neutre (pas de prime de risque)
 */

import { OptionType } from './blackScholes';

export interface MCResult {
  price:        number;
  stdDev:       number;   // Écart-type empirique des payoffs actualisés
  stdErr:       number;   // Erreur standard de l'estimateur
  ci95Lo:       number;   // Borne inférieure IC 95%
  ci95Hi:       number;   // Borne supérieure IC 95%
  payoffSample: number[]; // Échantillon pour histogramme
  discFactor:   number;   // e^(-rT)
}

/** Générateur pseudo-aléatoire Mulberry32 (seedable, qualité suffisante) */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Transform de Box-Muller : (U1, U2) → Z ~ N(0,1) */
function boxMuller(rand: () => number): number {
  const u1 = rand() + 1e-15; // Évite log(0)
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function runMonteCarlo(
  S: number, K: number, T: number,
  r: number, q: number, sigma: number,
  type: OptionType,
  N: number,        // Nombre de simulations
  steps: number,    // Pas temporels par trajectoire
  seed?: number | null
): MCResult {
  const dt        = T / steps;
  const drift     = (r - q - 0.5 * sigma * sigma) * dt;
  const diffusion = sigma * Math.sqrt(dt);
  const discFactor = Math.exp(-r * T);

  const rand = seed != null ? mulberry32(seed) : Math.random.bind(Math);
  const payoffs = new Float64Array(N);
  const half = Math.floor(N / 2);

  // Boucle principale avec antithetic variates
  for (let i = 0; i < half; i++) {
    let St = S, StAnt = S;

    for (let j = 0; j < steps; j++) {
      const z = boxMuller(rand);
      St    *= Math.exp(drift + diffusion * z);
      StAnt *= Math.exp(drift - diffusion * z); // Antithétique
    }

    const p1 = type === 'call' ? Math.max(St - K,    0) : Math.max(K - St,    0);
    const p2 = type === 'call' ? Math.max(StAnt - K, 0) : Math.max(K - StAnt, 0);
    const avgPayoff = (p1 + p2) / 2;

    payoffs[i]        = avgPayoff;
    payoffs[half + i] = avgPayoff;
  }

  // Statistiques empiriques
  let sum = 0, sum2 = 0;
  for (let i = 0; i < N; i++) { sum += payoffs[i]; sum2 += payoffs[i] * payoffs[i]; }

  const mean     = sum / N;
  const variance = sum2 / N - mean * mean;
  const price    = discFactor * mean;
  const stdErr   = discFactor * Math.sqrt(variance / N);

  return {
    price,
    stdDev:  Math.sqrt(variance),
    stdErr,
    ci95Lo:  price - 1.96 * stdErr,
    ci95Hi:  price + 1.96 * stdErr,
    payoffSample: Array.from(payoffs.slice(0, Math.min(500, N))),
    discFactor
  };
}