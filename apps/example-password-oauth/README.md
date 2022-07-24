# Lucia Github and password auth example

```bash
npm install
```

## Setting up Supabase

Follow [this page](https://lucia-sveltekit.vercel.app/adapters/supabase) on setting up supabase. In addition to that, add a `email` varchar column in `users` table with `unique=true`.

Add the Supabase url and service role secret to `lib/lucia.ts`.

## Github

Create 2 new Github OAuth app, one for development and one for production. The callback url should be `locahost:3000/api/github` for dev and its equivalent for prod.

Add the client id and client secret to `routes/index.svelte` and `routes/api/github.ts`.
