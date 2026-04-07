/**
 * utils.ts — Fonctions mathématiques de base
 * Approximation Hart (1968) pour normalCDF — erreur < 7.5e-8
 */

/**
 * Cumulative distribution function de la loi normale standard N(0,1)
 * Approximation polynomiale de Hart — numériquement stable sur tout R
 */
export function normalCDF(x: number): number {
  if (x === Infinity) return 1;
  if (x === -Infinity) return 0;

  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * absX);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return 0.5 * (1 + sign * y);
}

/** Densité de la loi normale standard — φ(x) = exp(-x²/2) / √(2π) */
export function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/** Validation stricte des paramètres BSM */
export interface ValidationResult { valid: boolean; error?: string; }

export function validateBSMParams(S: number, K: number, T: number, sigma: number): ValidationResult {
  if (S <= 0) return { valid: false, error: 'Spot price S must be strictly positive' };
  if (K <= 0) return { valid: false, error: 'Strike K must be strictly positive' };
  if (T <= 1e-10) return { valid: false, error: 'Maturity T must be strictly positive' };
  if (sigma <= 1e-10) return { valid: false, error: 'Volatility σ must be strictly positive' };
  return { valid: true };
}