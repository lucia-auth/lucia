---
layout: "@layouts/DocLayout.astro"
title: "LegacyScrypt.hash()"
format: "code"
---

Method of [`LegacyScrypt`](/reference/main/LegacyScrypt). Hashes the provided password with scrypt.

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
