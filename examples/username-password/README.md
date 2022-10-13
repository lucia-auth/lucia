# Lucia username/password example

Example using [Lucia](https://github.com/pilcrowOnPaper/lucia-sveltekit/tree/main/packages/lucia-sveltekit) and [Supabase adapter](https://github.com/pilcrowOnPaper/lucia-sveltekit/tree/main/packages/adapter-supabase).

## Setup

```bash
npm install
npm run dev
```

### Environment variables

```bash
SUPABASE_URL=""
SUPABASE_SECRET="" # service_role
```

### Database

Add a `username` column to `user` table (varchar, unique).