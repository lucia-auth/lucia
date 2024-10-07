---
title: "Cookie"
---

# `Cookie`

Represents a cookie.

## Constructor

```ts
//$ CookieAttributes=/reference/main/CookieAttributes
function constructor(name: string, value: string, attributes?: $$CookieAttributes): this;
```

### Parameters

-   `name`
-   `value`
-   `attributes`

## Methods

-   [`serialize()`](/reference/cookie/Cookie/serialize)

## Properties

```ts
//$ CookieAttributes=/reference/main/CookieAttributes
interface Properties {
	name: string;
	value: string;
	attributes: $$CookieAttributes;
}
```

-   `name`
-   `value`
-   `attributes`

## Example

```ts
import { Cookie } from "lucia";

const sessionCookie = new Cookie("session", sessionId, {
	maxAge: 60 * 60 * 24,
	httpOnly: true,
	secure: true,
	path: "/"
});
response.headers.set("Set-Cookie", sessionCookie.serialize());
```

If your framework provides an API for setting cookies:

```ts
import { Cookie } from "lucia";

const sessionCookie = new Cookie("session", sessionId, {
	maxAge: 60 * 60 * 24,
	httpOnly: true,
	secure: true,
	path: "/"
});
setCookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
```
