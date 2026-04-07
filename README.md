# Option Pricing Terminal

A professional-grade options pricing tool built for quantitative finance education and portfolio presentation.

## Models Implemented

### Black-Scholes-Merton (1973)
Closed-form pricing for European options with continuous dividend yield (Merton extension).

**Formula:**
- Call: `C = S·e^(-qT)·N(d1) - K·e^(-rT)·N(d2)`
- Put:  `P = K·e^(-rT)·N(-d2) - S·e^(-qT)·N(-d1)`
- `d1 = [ln(S/K) + (r - q + ½σ²)T] / (σ√T)`
- `d2 = d1 - σ√T`

### Monte Carlo (GBM under Q)
`S(t+dt) = S(t) · exp[(r - q - ½σ²)dt + σ√dt · Z]`
- Variance reduction: antithetic variates
- 95% confidence interval reported

### Implied Volatility
Bisection (global) + Newton-Raphson (local refinement).

## Assumptions
- Frictionless market, no transaction costs
- Constant risk-free rate and volatility
- Continuous dividend yield
- Log-normal asset returns (no jumps)
- European exercise only

## Limitations
- No volatility smile / surface (flat vol assumption)
- No jump diffusion (Merton 1976, Kou)
- No stochastic volatility (Heston, SABR)
- American options not supported in V1

## Stack
- React 18 + TypeScript
- Chart.js for visualizations
- Pure TypeScript math engine (no external math libs)

## Run
```bash
npm install
npm run dev
```

## Tests
```bash
npm test
```

## Planned Extensions (V2)
- Binomial tree (CRR)
- American options (Longstaff-Schwartz LSM)
- Volatility surface interpolation
- Historical vol from CSV import