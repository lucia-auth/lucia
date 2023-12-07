---
layout: "@layouts/ReferenceLayout.astro"
type: "class"
---

A pure JS implementation of Scrypt for projects that used Lucia v1/v2. For new projects, use [`Scrypt`]().

The output hash is a combination of the scrypt hash and the 32-bytes salt, in the format of `<salt>:<hash>`.

## Constructor

```ts
function constructor(options?: { N?: number; r?: number; p?: number; dkLen?: number }): this;
```

### Parameters

- `options`
  - `N` (default: `16384`)
  - `r` (default: `16`)
  - `p` (default: `1`)
  - `dkLen` (default: `64`)

## Methods

- [`hash()`](ref:password/Argon2id)
- [`verify()`](ref:password/Argon2id)

## Example

```ts
import { LegacyScrypt } from "lucia";

const scrypt = new LegacyScrypt();
const hash = await scrypt.hash(password);
const validPassword = await scrypt.verify(hash, password);
```
