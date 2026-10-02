# AGENTS.md

`@brunocarvalho/sanitize-html` — a TypeScript XSS-sanitizing HTML library. The
entire implementation is a single file, `src/index.ts`; the public entrypoint is
`sanitizeHtml` plus `sanitizeHtml.simpleTransform` and the exported `defaults`.

## Commands

- `npm run build` — compile `src/` to `dist/` with `tsc` (emits `.js` + `.d.ts`).
- `npm test` — run `jest` (config is inline in `package.json`, there is no
  separate `jest.config`).

There is **no** lint, typecheck, format, or CI script. Verify changes with
`npm run build && npm test`.

## Conventions & gotchas

- **Editor**: 2-space indent, LF, trailing whitespace trimmed, final newline
  (`.editorconfig`).
- **Tests**: specs live next to the source in `src/*.spec.ts` and import via
  `./index` (relative). Jest collects coverage by default; `jest-junit` writes
  `junit.xml` (gitignored). `testTimeout` is 30s and `resetMocks`/`clearMocks`
  are on.
- **tsconfig** is strict and sets `noUnusedLocals: true`; `dist/` and spec files
  are excluded from `tsc`, so `npm run build` will not typecheck tests.
- **ts-jest** transforms both `.ts` and `.js`; `transformIgnorePatterns` only
  transforms the htmlparser2 dependency subtree, so other `node_modules` are
  used as-is.
- **Options merge shallowly**: `sanitizeHtml.defaults` is merged with user
  options via `Object.assign`, so nested option objects are shared by reference.
  Don't mutate the merged options or the exported defaults.
