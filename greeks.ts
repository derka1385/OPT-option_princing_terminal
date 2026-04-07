import { normalCDF, normalPDF, computeD1D2 } from "./pricing";
import type { Greeks, OptionType } from "./types";

export function computeGreeks(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  q: number,
  type: OptionType
): Greeks {
  if (T <= 0 || sigma <= 0) {
    const atm = Math.abs(S - K) < 1e-10;
    return {
      delta: type === "call" ? (S >= K ? 1 : 0) : (S <= K ? -1 : 0),
      gamma: atm ? Infinity : 0,
      theta: 0,
      vega: 0,
      rho: 0,
    };
  }

  const { d1, d2 } = computeD1D2(S, K, T, r, sigma, q);
  const sqrtT = Math.sqrt(T);
  const df = Math.exp(-r * T);
  const dq = Math.exp(-q * T);
  const pdf1 = normalPDF(d1);

  const gamma = (dq * pdf1) / (S * sigma * sqrtT);
  const vega = S * dq * pdf1 * sqrtT;

  let delta: number;
  let theta: number;
  let rho: number;

  if (type === "call") {
    delta = dq * normalCDF(d1);
    theta =
      (-(S * dq * pdf1 * sigma) / (2 * sqrtT) -
        r * K * df * normalCDF(d2) +
        q * S * dq * normalCDF(d1)) /
      365;
    rho = K * T * df * normalCDF(d2) / 100;
  } else {
    delta = dq * (normalCDF(d1) - 1);
    theta =
      (-(S * dq * pdf1 * sigma) / (2 * sqrtT) +
        r * K * df * normalCDF(-d2) -
        q * S * dq * normalCDF(-d1)) /
      365;
    rho = (-K * T * df * normalCDF(-d2)) / 100;
  }

  return { delta, gamma, theta, vega, rho };
}
