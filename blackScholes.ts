/**
 * blackScholes.ts — Pricing BSM avec dividendes continus (Merton 1973)
 *
 * Hypothèses :
 *  - Marché frictionless, trading continu
 *  - GBM pour S sous mesure risque-neutre Q
 *  - Taux r et σ constants
 *  - Dividende yield q continu (ex: indice action)
 *
 * Cas limites gérés :
 *  - T → 0 : retour payoff intrinsèque
 *  - σ → 0 : retour valeur actualisée déterministe
 */

import { normalCDF, validateBSMParams } from './utils';

export type OptionType = 'call' | 'put';

export interface BSMInputs {
  S: number;    // Spot price
  K: number;    // Strike price
  T: number;    // Time to maturity (years)
  r: number;    // Risk-free rate (continuous, annualized)
  q: number;    // Dividend yield (continuous, annualized)
  sigma: number; // Volatility (annualized)
  type: OptionType;
}

export interface D1D2Result {
  d1: number;
  d2: number;
  sqrtT: number;
}

/**
 * Calcul de d1 et d2 — cœur de la formule BSM
 * d1 = [ln(S/K) + (r - q + ½σ²)T] / (σ√T)
 * d2 = d1 - σ√T
 */
export function computeD1D2(S: number, K: number, T: number, r: number, q: number, sigma: number): D1D2Result {
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  return { d1, d2, sqrtT };
}

/**
 * Prix Black-Scholes-Merton (avec dividendes Merton 1973)
 * Call : S·e^(-qT)·N(d1) - K·e^(-rT)·N(d2)
 * Put  : K·e^(-rT)·N(-d2) - S·e^(-qT)·N(-d1)
 */
export function blackScholes({ S, K, T, r, q, sigma, type }: BSMInputs): number {
  const { valid } = validateBSMParams(S, K, T, sigma);
  if (!valid) return 0;

  const { d1, d2 } = computeD1D2(S, K, T, r, q, sigma);
  const discS = S * Math.exp(-q * T);  // Forward price dividend-adjusted
  const discK = K * Math.exp(-r * T);  // Strike actualisé

  if (type === 'call') {
    return discS * normalCDF(d1) - discK * normalCDF(d2);
  }
  return discK * normalCDF(-d2) - discS * normalCDF(-d1);
}