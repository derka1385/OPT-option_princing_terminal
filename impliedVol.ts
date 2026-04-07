import { blackScholes } from "./pricing";
import type { OptionType } from "./types";

export function impliedVol(
  marketPrice: number,
  S: number,
  K: number,
  T: number,
  r: number,
  q: number,
  type: OptionType
): number | null {
  if (T <= 0 || marketPrice <= 0) return null;

  const intrinsic =
    type === "call"
      ? Math.max(S * Math.exp(-q * T) - K * Math.exp(-r * T), 0)
      : Math.max(K * Math.exp(-r * T) - S * Math.exp(-q * T), 0);

  if (marketPrice <= intrinsic) return null;

  const price = (sigma: number) =>
    blackScholes(S, K, T, r, sigma, q, type).price;

  let low = 1e-6;
  let high = 10.0;

  if (price(high) < marketPrice) return null;
  if (price(low) > marketPrice) return null;

  // Bisection
  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const diff = price(mid) - marketPrice;
    if (Math.abs(diff) < 1e-8) return mid;
    if (diff > 0) high = mid;
    else low = mid;
  }

  // Newton-Raphson refinement
  let sigma = (low + high) / 2;
  for (let i = 0; i < 50; i++) {
    const { price: p, d1 } = blackScholes(S, K, T, r, sigma, q, type);
    const diff = p - marketPrice;
    if (Math.abs(diff) < 1e-10) break;
    const sqrtT = Math.sqrt(T);
    const vegaVal =
      S * Math.exp(-q * T) * Math.exp(-0.5 * d1 * d1) * sqrtT / Math.sqrt(2 * Math.PI);
    if (Math.abs(vegaVal) < 1e-12) break;
    sigma -= diff / vegaVal;
    if (sigma <= 0) sigma = 1e-6;
    if (sigma > 10) sigma = 10;
  }

  return sigma;
}
