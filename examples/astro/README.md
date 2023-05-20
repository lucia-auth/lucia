# Lucia + Astro demo

## Setup

### Install dependencies

```bash
pnpm i
```

### Prisma

Migrate Prisma schema:

```bash
pnpm prisma migrate dev --name init
```

### Github OAuth

Create a Github OAuth app and copy-paste client id and secret into `.env`.

## Run

```bash
pnpm dev
```

## Polyfill for Node.js

If you're using Node.js (v18 or below) for development or production, a polyfill is required! Replace `astro dev` with `NODE_OPTIONS=--experimental-global-webcrypto astro dev` etc in package.json or import `lucia-auth/polyfill/node` in `lib/lucia.ts`:

```ts
import "lucia-auth/polyfill/node";

export const auth = lucia({
	// ...
});
```
