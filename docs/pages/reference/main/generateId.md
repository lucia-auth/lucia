---
title: "generateId()"
---

# `generateId()`

Generates a cryptographically strong random string made of `a-z` (lowercase) and `0-9`.

## Definition

```ts
function generateId(length: number): string;
```

### Parameters

- `length`

## Example

```ts
import { generateId } from "oslo/random";

// 10-characters long string
generateId(10);
```
