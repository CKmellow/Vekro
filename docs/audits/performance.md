# Performance budget (M16 #128)

## Bundle (gzip, what a buyer downloads before the page renders)

| Route | Before | After | Budget (CI) |
| --- | --- | --- | --- |
| Entry (every page) | 201 kB | 178 kB | 185 kB |
| B3 order tracker (the SMS link) | 286 kB | 218 kB | 230 kB |
| B1 pay (the Trust Link) | 286 kB | 254 kB | 265 kB |
| B4 inspection | 286 kB | 218 kB | 230 kB |
| B8 sign in | 286 kB | 188 kB | 200 kB |
| Landing and help | 212 kB | 199 kB | 210 kB |

What changed:
- Buyer routes load per page instead of one buyer chunk, so the order tracker no longer downloads the form libraries (zod, react-hook-form) that only B1, B5 and B6 use.
- motion runs through `LazyMotion` with the `domAnimation` feature set and the lightweight `m` components (the one layout animation, on S14, became a fade).
- The seller and console shells (layouts, icons, shell controller) moved out of the entry into `accountShells.tsx`, loaded with those areas.
- S12's charts were already their own chunk (#264).

`npm run budget` (`scripts/check-bundle-budget.mjs`) reads the chunk graph from Vite's manifest after the build and fails CI when a route goes over budget.

## Lighthouse

Lighthouse couldn't be run from this environment (downloading the tool was blocked). A Playwright approximation of its mobile profile (4x CPU slowdown, 150 ms RTT, 1.6 Mbps, cold cache, median of 3) on the production build measured FCP about 1.9 to 2.2 s, LCP 1.9 to 3.1 s and TBT 500 to 1,000 ms before these changes; the runs were too noisy on this machine to compare small changes reliably. To record the scores for the defense:

```
npm run build && npx vite preview --port 4180
npx lighthouse http://localhost:4180/ --preset=perf --form-factor=mobile --view
```

Expect total blocking time to be the weakest metric (React and the router parse on a throttled CPU).
