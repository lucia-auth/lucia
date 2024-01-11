# `@lucia-auth/adapter-denokv`

Deno KV adapter for Lucia v3.

**[Documentation](https://lucia-auth.com/reference#lucia-authadapter-denokv)**

**[Lucia documentation](https://v3.lucia-auth.com)**

**[Changelog](https://github.com/pilcrowOnPaper/lucia/blob/main/packages/adapter-denokv/CHANGELOG.md)**

## Supported drivers

- [@deno/kv (`@deno/kv`)](https://github.com/denoland/denokv)

## Installation

```
npm install @lucia-auth/adapter-denokv@beta
pnpm add @lucia-auth/adapter-denokv@beta
yarn add @lucia-auth/adapter-denokv@beta
```

## Testing

KV has an in memory db option that is used by the test for simplicity and removed the need for env vars.

```
pnpm test
```
