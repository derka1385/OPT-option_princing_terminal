export type OptionType = "call" | "put";

export interface OptionParams {
  S: number;
  K: number;
  T: number;
  r: number;
  sigma: number;
  q: number;
  type: OptionType;
  N: number;
  steps: number;
  seed?: number;
  marketPrice?: number;
}

export interface D1D2 {
  d1: number;
  d2: number;
}

export interface BSResult {
  price: number;
  d1: number;
  d2: number;
}

export interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface MonteCarloResult {
  price: number;
  stdError: number;
  paths: number[][];
  finalPrices: number[];
}

export interface PricingResult {
  bs: BSResult;
  greeks: Greeks;
  mc: MonteCarloResult;
  impliedVol?: number;
  params: OptionParams;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
