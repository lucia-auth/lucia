---
title: "Introduction"
---

The tokens integration provides wrappers to more easily implement tokens using Lucia's [single-use keys](/learn/basics/keys#persistent-vs-single-use). There are few important limitations to this approach:

1. You cannot store custom attributes to tokens
2. Tokens must be linked to a single user
3. Tokens are single use and are invalidated upon use

As such, these are mainly intended for simple verification tasks, like for email verification and password resets, and not for complex use cases such as API tokens.

## Installation

```
npm i @lucia-auth/tokens
pnpm add @lucia-auth/tokens
yarn add @lucia-auth/tokens
```

## Token types

This packages provides a wrapper for 2 types of tokens:

- [Id tokens](/tokens/basics/id-tokens): Regular tokens that can be used to authenticate a user (magic links)
- [Password tokens](/tokens/basics/password-tokens): Single use codes to be used within an auth context (one time passwords)

Both of these provide a similar set of APIs.
