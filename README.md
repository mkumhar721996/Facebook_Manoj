# Facebook_Manoj

## Running tests

`npm test` runs `node --test src/**/*.test.ts` directly against the `.ts` sources. No
`ts-node`/`tsx` loader is needed: this repo targets a Node.js version with built-in
TypeScript type-stripping enabled by default (verified working, unflagged, on the
Node version used in CI). If you're on an older Node build where type-stripping is
still experimental, run with `node --experimental-strip-types --test src/**/*.test.ts`.