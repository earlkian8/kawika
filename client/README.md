# Kawika client

React + TypeScript single-page app for Kawika, built with Vite.

```bash
npm install
npx playwright install chromium   # once, for end-to-end tests
npm run dev                       # http://localhost:5173 (proxies /api to :8000)
```

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the build with production security headers |
| `npm run lint` | ESLint |
| `npm test` / `npm run test:watch` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end UAT suite on desktop and mobile Chromium |
| `npm run test:e2e:report` | Open the last end-to-end report |

The end-to-end suite starts its own API (port 8010, `kawika_test` database, rebuilt with `kawika db -d test fresh`) and web server (port 5180), so the server's virtual environment and test database must be set up first.

- Module reference: [../docs/frontend.md](../docs/frontend.md)
- Conventions: [../docs/architecture.md](../docs/architecture.md)
- Tests: [../docs/testing.md](../docs/testing.md)
