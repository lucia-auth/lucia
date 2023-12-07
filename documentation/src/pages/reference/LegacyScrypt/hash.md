---
layout: "@layouts/ReferenceLayout.astro"
type: "method"
---

Hashes the provided password with scrypt.

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
