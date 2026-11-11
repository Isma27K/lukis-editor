# CLAUDE.md

## Project Structure

Excalidraw is a **monorepo** with a clear separation between the core library and the application:

- **`packages/excalidraw/`** - Main React component library published to npm as `@excalidraw/excalidraw`
- **`excalidraw-app/`** - Full-featured web application (excalidraw.com) that uses the library
- **`packages/`** - Core packages: `@excalidraw/common`, `@excalidraw/element`, `@excalidraw/math`, `@excalidraw/utils`
- **`examples/`** - Integration examples (NextJS, browser script)

## Development Workflow

1. **Package Development**: Work in `packages/*` for editor features
2. **App Development**: Work in `excalidraw-app/` for app-specific features
3. **Testing**: Always run `yarn test:update` before committing
4. **Type Safety**: Use `yarn test:typecheck` to verify TypeScript

## Development Commands

```bash
yarn test:typecheck  # TypeScript type checking
yarn test:update     # Run all tests (with snapshot updates)
yarn fix             # Auto-fix formatting and linting issues
```

## Architecture Notes

### Package System

- Uses Yarn workspaces for monorepo management
- Internal packages use path aliases (see `vitest.config.mts`)
- Build system uses esbuild for packages, Vite for the app
- TypeScript throughout with strict configuration

## Lukis fork

This copy is Lukis's fork of Excalidraw. The `lukis` branch is what Lukis builds; `upstream` is excalidraw/excalidraw.

- Mark every change to upstream code with a `[lukis]` comment, so upstream merges show what's ours. Keep changes small and local to where upstream does the same thing.
- After changing `packages/`, commit here, push the fork, then run `npm run excalidraw:build` in `../frontend` and commit its `.excalidraw-ref` and `package-lock.json` together. The frontend's CI checks out this repo at that commit, so the fork must be pushed first.
- Pulling upstream fixes: `git fetch upstream`, then merge or cherry-pick into `lukis`, run the tests, and rebuild as above.
- Tests: 13 tests in `DefaultSidebar`, `Sidebar` and `animation` already fail on the upstream commit we forked from (`b7de45e`), and `tsc` reports 2 errors in `MermaidToExcalidraw.test.tsx`; compare against those before blaming a change.
- Changes so far: exact corner radius (`roundness.value`, the "Radius" slider under "Edges") for rectangles, images, embeds and diamonds.
