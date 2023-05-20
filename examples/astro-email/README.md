# Lucia + Astro: Email verification and password reset

This project includes a mock mailbox.

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
