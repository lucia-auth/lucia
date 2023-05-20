# Lucia + Remix demo

Install dependencies:

```bash
pnpm i
```

Migrate Prisma schema:

```bash
pnpm prisma migrate dev --name init
```

Run:

```bash
pnpm dev
```

### Github OAuth

```bash
# .env
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

## Polyfill for Node.js

If you're using Node.js (v18 or below) for development or production, a polyfill is required! Replace `next dev` with `NODE_OPTIONS=--experimental-global-webcrypto next dev` etc in package.json or import `lucia-auth/polyfill/node` in `lucia.ts`:

```ts
import "lucia-auth/polyfill/node";

export const auth = lucia({
	// ...
});
```
