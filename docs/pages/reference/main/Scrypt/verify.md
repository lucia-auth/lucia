---
title: "Scrypt.verify()"
---

# `Scrypt.verify()`

Method of [`Scrypt`](/reference/main/Scrypt). Verifies the password with the hash using scrypt.

## Definition

```ts
function verify(hash: string, password: string): Promise<boolean>;
```

### Parameters

-   `hash`
-   `password`

## Example

```ts
const validPassword = await scrypt.verify(hash, password);
```
