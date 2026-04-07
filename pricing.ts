import type { D1D2, BSResult, OptionType } from "./types";

export function normalCDF(x: number): number {
  if (x === Infinity) return 1;
  if (x === -Infinity) return 0;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y =
    1.0 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return 0.5 * (1.0 + sign * y);
}

export function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export function computeD1D2(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  q: number
): D1D2 {
  if (T <= 0 || sigma <= 0) {
    return { d1: 0, d2: 0 };
  }
  const sqrtT = Math.sqrt(T);
  const d1 =
    (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  return { d1, d2 };
}

export function blackScholes(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  q: number,
  type: OptionType
): BSResult {
  if (T <= 0) {
    const intrinsic =
      type === "call"
        ? Math.max(S - K, 0)
        : Math.max(K - S, 0);
    return { price: intrinsic, d1: 0, d2: 0 };
  }

  if (sigma <= 0) {
    const fwd = S * Math.exp((r - q) * T);
    const df = Math.exp(-r * T);
    const price =
      type === "call"
        ? df * Math.max(fwd - K, 0)
        : df * Math.max(K - fwd, 0);
    return { price, d1: 0, d2: 0 };
  }

  const { d1, d2 } = computeD1D2(S, K, T, r, sigma, q);
  const df = Math.exp(-r * T);
  const dq = Math.exp(-q * T);

  let price: number;
  if (type === "call") {
    price = S * dq * normalCDF(d1) - K * df * normalCDF(d2);
  } else {
    price = K * df * normalCDF(-d2) - S * dq * normalCDF(-d1);
  }

  return { price, d1, d2 };
}
