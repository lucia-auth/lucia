# Lucia

**While there was a new major version every day for the last week, v0.5.0 will be stable and breaking changes will be rare for a while.**

Lucia is a simple, JWT based authentication library for SvelteKit that connects your SvelteKit app with your database. It handles the bulk of the authentication process, like creating and validating tokens, but only just enough that you can build on top of it to fit your use case. That said, it isn't _just_ a JWT authentication library. It uses short-lived tokens, implements rotating refresh tokens, automatically refreshes tokens, and detects refresh token theft. It's main aim is to simplify the development process while not being a pain in the ass to customize!

It's important to note that this __isn't__ an out-of-the-box authentication library. It does not validate the user's input, it does not provide UI elements, and it does not provide a OAuth authentication (though it's simple to implement). These are out of the scope of this library and is left up to you. What it does provide is a set of tools for handling authentication, like `createUser` which saves the user in the database and generate a set of tokens.

> This library requires a database to work. If you need a free option, check out [Supabase](https://supabase.com), which Lucia supports out of the box.

Documentation: https://lucia-sveltekit.vercel.app


## Installation

```
npm install lucia-sveltekit
```
