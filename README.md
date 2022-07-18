# Lucia

Lucia is a JWT based authentication library for SvelteKit that works with your code, and not the other way around. It provides the necessary building blocks for implementing authentication, allowing you to customize it to your own needs.

> This library requires a database to work. If you need a free option, check out [Supabase](https://supabase.com), which Lucia supports out of the box.

Documentation: https://lucia-sveltekit.vercel.app

## Why Lucia ?

There are tons of client-side authentication services out there like Firebase, Auth0, or Supabase. But, they don't support SSR (SvelteKit) out of the box, and even if you get it to work, it's usually a very hacky solution that isn't worth the time. On the other hand, there are authentication libraries like NextAuth for Next.js that handles everything once you configure the database. But it's still limited in how it can be customized. Lucia aims to be a flexible customizable solution that is simple and intuitive.

## Installation

```
npm install lucia-sveltekit
```