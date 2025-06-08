---
title: "SvelteKit implementation notes"
---

# SvelteKit implementation notes

## Authorization check with layouts

A server load function inside `+layout.server.ts` will not run on navigation between pages nested inside it. For example, a load function in `+layout.server.ts` will not run when navigating between `/` and `/foo`. This means that anyone can skip layout server load functions.

```
routes/
    +layout.server.ts
    +page.svelte
    foo/
        +page.svelte
```

As such, sessions must be validated on a per-request basis by putting authorization checks in each `+page.server.ts` load function or in a `handle()` hook.
