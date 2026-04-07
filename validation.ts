import type { OptionParams, ValidationResult } from "./types";

export function validateParams(params: Partial<OptionParams>): ValidationResult {
  const errors: string[] = [];

  if (params.S === undefined || isNaN(params.S) || params.S <= 0)
    errors.push("Spot price S must be > 0");

  if (params.K === undefined || isNaN(params.K) || params.K <= 0)
    errors.push("Strike K must be > 0");

  if (params.T === undefined || isNaN(params.T) || params.T < 0)
    errors.push("Maturity T must be >= 0");

  if (params.r === undefined || isNaN(params.r))
    errors.push("Risk-free rate r is required");

  if (params.sigma === undefined || isNaN(params.sigma) || params.sigma < 0)
    errors.push("Volatility σ must be >= 0");

  if (params.q === undefined || isNaN(params.q))
    errors.push("Dividend yield q is required");

  if (params.N === undefined || isNaN(params.N) || params.N < 100 || params.N > 1000000)
    errors.push("Simulations N must be between 100 and 1,000,000");

  if (params.steps === undefined || isNaN(params.steps) || params.steps < 1 || params.steps > 1000)
    errors.push("Steps must be between 1 and 1000");

  if (params.marketPrice !== undefined && !isNaN(params.marketPrice) && params.marketPrice < 0)
    errors.push("Market price must be >= 0");

  return { valid: errors.length === 0, errors };
}