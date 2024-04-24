---
title: "generateIdFromEntropySize()"
---

# `generateIdFromEntropySize()`

Generates a cryptographically strong random string made of `a-z` (lowercase) and `2-7` using the provided entropy size. The output length increases as the entropy size increases.

If `size` is a multiple of 5, the output size will be `(size * 8) / 5` (see base32 encoding).

This has better performance than [`generateId()`](/reference/main/generateId) and should be your default choice.

## Definition

```ts
function generateIdFromEntropySize(size: number): string;
```

### Parameters

-   `size`: Number of bytes to use

## Example

```ts
import { generateIdFromEntropySize } from "lucia";

// 16-characters long
generateIdFromEntropySize(10);
```
