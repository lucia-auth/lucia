---
title: "Scrypt"
---

# `Scrypt`

A pure JS implementation of Scrypt. Provides methods for hashing passwords and verifying hashes with [scrypt](https://datatracker.ietf.org/doc/html/rfc7914). By default, the configuration is set to [the recommended values](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

The output hash is a combination of the scrypt hash and the 32-bytes salt, in the format of `<salt>:<hash>`.

Since it's pure JS, it is anywhere from 2~3 times slower than implementations based on native code. See Oslo's [`Scrypt`](https://oslo.js.org/reference/password/Scrypt) for a faster API (Node.js-only).

## Constructor

```ts
function constructor(options?: { N?: number; r?: number; p?: number; dkLen?: number }): this;
```

### Parameters

-   `options`
    -   `N` (default: `16384`)
    -   `r` (default: `16`)
    -   `p` (default: `1`)
    -   `dkLen` (default: `64`)

## Methods

-   [`hash()`](ref:password/Argon2id)
-   [`verify()`](ref:password/Argon2id)

## Example

```ts
import { Scrypt } from "lucia";

const scrypt = new Scrypt();
const hash = await scrypt.hash(password);
const validPassword = await scrypt.verify(hash, password);
```
