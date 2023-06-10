# Lucia + Astro demo

## Setup

Install dependencies

```
pnpm i
```

Setup database:

```
pnpm prisma db push
```

Start server:

```
pnpm dev
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
