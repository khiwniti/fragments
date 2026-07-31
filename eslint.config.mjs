import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

// Flat-config equivalent of the legacy .eslintrc.json `{ "extends": "next/core-web-vitals" }`.
// eslint-config-next@16 ships a native flat-config export at `core-web-vitals.js`, so we
// don't need `@eslint/eslintrc`'s FlatCompat shim — using it here trips a known
// circular-structure bug in the compat layer against v16 configs.
const config = [
  {
    ignores: ['.next/**', 'node_modules/**'],
  },
  ...nextCoreWebVitals,
]

export default config
