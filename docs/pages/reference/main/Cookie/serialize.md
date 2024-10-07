---
title: "Cookie.serialize()"
---

# `Cookie.serialize()`

Serializes cookie for `Set-Cookie` header.

```ts
function serialize(): string;
```

## Example

```ts
response.headers.set("Set-Cookie", cookie.serialize());
```
