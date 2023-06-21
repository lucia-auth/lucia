---
order: 2
title: "Middleware API"
description: "Learn how to implement your own middleware"
---

Middleware transform framework and runtime specific request/response objects passed to [`Auth.handleRequest()`](/reference/lucia/interfaces/auth#handlerequest) into Lucia's specific API.

## `Middleware`

```ts
type Middleware<_Args extends any[] = any> = (context: {
	args: _Args;
	env: "DEV" | "PROD";
	sessionCookieName: string;
}) => RequestContext;
```

##### Parameters

| name                | type              | description                                                                                                                             |
| ------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `context.args`      | `_Args`           | Arguments passed to [`Auth.handleRequest()`](/reference/lucia/interfaces/auth#handlerequest) when the middleware is used                |
| `context.env`       | `"DEV" \| "PROD"` | Project [`env`](/basics/configuration#env) configuration                                                                                |
| `sessionCookieName` | `string`          | Session cookie name defined in [`sessionCookie.name`](/basics/configuration#sessioncookie) configuration (or default name if undefined) |

##### Generics

| name    | extends | description                                                                                                            |
| ------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `_Args` | `any[]` | Parameter type of [`Auth.handleRequest()`](/reference/lucia/interfaces/auth#handlerequest) when the middleware is used |

### `RequestContext`

```ts
type RequestContext = {
	request: LuciaRequest;
	setCookie: (cookie: Cookie) => void;
};
```

#### Properties

| property  | type                                                       |
| --------- | ---------------------------------------------------------- |
| `request` | [`LuciaRequest`](/reference/lucia/interfaces#luciarequest) |

#### `setCookie()`

Sets the provided cookie.

```ts
const setCookie: (cookie: Cookie) => void;
```

##### Parameters

| name     | type                                           | description   |
| -------- | ---------------------------------------------- | ------------- |
| `cookie` | [`Cookie`](/reference/lucia/interfaces#cookie) | Cookie to set |

## Typing `Middleware`

When creating a middleware, it's crucial that you explicitly declare type `Middleware` so that parameters `context.args` is properly typed.

```ts
export const customMiddleware = (): Middleware<[Request]> => {
	return (context) => {
		return {
			// ...
		};
	};
};
```
