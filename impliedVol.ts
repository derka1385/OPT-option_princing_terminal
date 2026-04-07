/**
 * impliedVol.ts — Calcul de la volatilité implicite
 *
 * Algorithme à deux étapes :
 *  1. Bissection globale sur [σ_lo, σ_hi] — convergence garantie si racine existe
 *  2. Raffinement Newton-Raphson — convergence quadratique locale
 *
 * Cas d'échec retournant null :
 *  - Prix de marché < valeur intrinsèque (violation no-arbitrage)
 *  - Pas de racine dans [1e-4, 5.0] (500% vol max)
 *  - Instabilité numérique (vega ≈ 0 → NR diverge)
 */

import { blackScholes, BSMInputs, computeD1D2, OptionType } from './blackScholes';
import { normalPDF } from './utils';

const IV_TOL      = 1e-6;
const IV_MAX_ITER = 200;
const SIGMA_LO    = 1e-4;
const SIGMA_HI    = 5.0;

export function impliedVolatility(
  S: number, K: number, T: number, r: number, q: number,
  marketPrice: number,
  type: OptionType
): number | null {
  if (!marketPrice || marketPrice <= 0) return null;

  // Vérification valeur intrinsèque (no-arbitrage)
  const intrinsic = type === 'call'
    ? Math.max(S * Math.exp(-q * T) - K * Math.exp(-r * T), 0)
    : Math.max(K * Math.exp(-r * T) - S * Math.exp(-q * T), 0);

  if (marketPrice < intrinsic - 1e-4) return null;

  const bsPrice = (sigma: number) =>
    blackScholes({ S, K, T, r, q, sigma, type } as BSMInputs);

  // ── Étape 1 : Bissection
  let sigLo = SIGMA_LO, sigHi = SIGMA_HI;
  let fLo = bsPrice(sigLo) - marketPrice;
  let fHi = bsPrice(sigHi) - marketPrice;

  if (fLo * fHi > 0) return null; // Pas de racine → impossible

  let sigMid = 0.2;
  for (let i = 0; i < IV_MAX_ITER; i++) {
    sigMid = (sigLo + sigHi) / 2;
    const fMid = bsPrice(sigMid) - marketPrice;
    if (Math.abs(fMid) < IV_TOL) break;
    fLo * fMid < 0 ? (sigHi = sigMid) : (sigLo = sigMid, fLo = fMid);
  }

  // ── Étape 2 : Newton-Raphson (raffinement)
  let sig = sigMid;
  for (let i = 0; i < 10; i++) {
    const price = bsPrice(sig);
    const { d1, sqrtT } = computeD1D2(S, K, T, r, q, sig);
    const vegaRaw = S * Math.exp(-q * T) * normalPDF(d1) * sqrtT;

    if (Math.abs(vegaRaw) < 1e-12) break; // Vega dégénéré → arrêt

    const step = (price - marketPrice) / vegaRaw;
    sig -= step;
    sig = Math.max(sig, SIGMA_LO); // Clamp positif

    if (Math.abs(step) < IV_TOL) break;
  }

  return sig > SIGMA_LO && sig < SIGMA_HI ? sig : sigMid;
}