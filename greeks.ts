/**
 * greeks.ts — Calcul fermé des Greeks BSM
 *
 * Toutes les dérivées sont analytiques (pas de différences finies).
 * Vega et Rho sont normalisés par 1% pour l'usage pratique.
 * Theta est exprimé par jour calendaire (divisé par 365).
 *
 * Limites :
 *  - Gamma et Vega → ∞ quand T → 0 et S ≈ K (ATM)
 *  - Ces instabilités sont gérées par la validation en amont
 */

import { normalCDF, normalPDF } from './utils';
import { computeD1D2, OptionType } from './blackScholes';

export interface Greeks {
  delta: number;  // ∂V/∂S
  gamma: number;  // ∂²V/∂S²
  vega:  number;  // ∂V/∂σ (per 1% vol move)
  theta: number;  // ∂V/∂t (per calendar day, sign convention: negative for long options)
  rho:   number;  // ∂V/∂r (per 1% rate move)
}

export function computeGreeks(
  S: number, K: number, T: number,
  r: number, q: number, sigma: number,
  type: OptionType
): Greeks {
  if (S <= 0 || K <= 0 || T <= 1e-10 || sigma <= 1e-10) {
    return { delta: 0, gamma: 0, vega: 0, theta: 0, rho: 0 };
  }

  const { d1, d2, sqrtT } = computeD1D2(S, K, T, r, q, sigma);
  const eqT  = Math.exp(-q * T);
  const erT  = Math.exp(-r * T);
  const φ_d1 = normalPDF(d1);

  // Delta : probabilité risque-neutre d'exercice (ajustée dividendes)
  const delta = type === 'call'
    ? eqT * normalCDF(d1)
    : -eqT * normalCDF(-d1);

  // Gamma : identique call et put (parité put-call)
  const gamma = (eqT * φ_d1) / (S * sigma * sqrtT);

  // Vega : /100 → variation par 1 point de volatilité (1%)
  const vega = S * eqT * φ_d1 * sqrtT / 100;

  // Theta (convention : perte de valeur sur 1 jour = négatif pour position longue)
  const thetaBase = -(S * eqT * φ_d1 * sigma) / (2 * sqrtT);
  const theta = type === 'call'
    ? (thetaBase - r * K * erT * normalCDF(d2)  + q * S * eqT * normalCDF(d1))  / 365
    : (thetaBase + r * K * erT * normalCDF(-d2) - q * S * eqT * normalCDF(-d1)) / 365;

  // Rho : /100 → variation par 1% de taux
  const rho = type === 'call'
    ?  K * T * erT * normalCDF(d2)  / 100
    : -K * T * erT * normalCDF(-d2) / 100;

  return { delta, gamma, vega, theta, rho };
}