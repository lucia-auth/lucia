---
layout: "@layouts/DocLayout.astro"
title: "Scrypt.hash()"
format: "code"
---

Method of [`Scrypt`](/reference/main/Scrypt). Hashes the provided password with scrypt.

## Definition

```ts
function hash(password: string): Promise<string>;
```

### Parameters

- `password`

## Example

```ts
const hash = await scrypt.hash(password);
```
