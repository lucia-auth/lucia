---
order: 0
title: "AuthRequest"
format: "code"
---

On initialization, it will check the request origin with [`Auth.validateRequestOrigin()`](). If the request is from an untrusted origin, it will ignore all cookies sent with the request. This can be disabled with [`csrfProtection`]() configuration.

## `renewBearerToken()`

Renews the session stored in the bearer token and returns the renewed session, or `null` if the session is invalid.

```ts
const renewBearerToken: () => Promise<Session | null>;
```

##### Returns

| type          | description                   |
| ------------- | ----------------------------- |
| [`Session`]() | The renewed session           |
| `null`        | The session stored is invalid |

## `setSession()`

Sets a session cookie. Providing `null` will create a blank session cookie that will delete the current one.

```ts
const setSession: (session: Session | null) => void;
```

##### Parameters

| name      | type                   | description      |
| --------- | ---------------------- | ---------------- |
| `session` | [`Session`]()`\| null` | Session to store |

#### Example

```ts
import { auth } from "./lucia.js";

const authRequest = auth.handleRequest();
authRequest.setSession(session);
authRequest.setSession(null); // delete session cookie
```

## `validate()`

Validates the session cookie using [`Auth.validateSession()`](). It returns the validated or renewed session if the cookie is valid, or `null` if not. Additionally, when a session is renewed, a new session cookie is set.

By default,this method will also return `null` if the request is from an untrusted origin.

```ts
const validate: () => Promise<Session | null>;
```

##### Returns

| type          | description                   |
| ------------- | ----------------------------- |
| [`Session`]() | The validated session         |
| `null`        | The session stored is invalid |

#### Example

```ts
import { auth } from "./lucia.js";

const authRequest = auth.handleRequest();
const session = await authRequest.validate();
if (session) {
	// valid session
}
```

## `validateBearerToken()`

Validates the session cookie using [`Auth.getSession()`](). It returns the validated session if the session is valid, or `null` if not. **Idle sessions are not renewed and `null` is returned.**

```ts
const validateBearerToken: () => Promise<Session | null>;
```

##### Returns

| type          | description                       |
| ------------- | --------------------------------- |
| [`Session`]() | The validated session             |
| `null`        | The session is invalid or expired |

#### Example

```ts
import { auth } from "./lucia.js";

const authRequest = auth.handleRequest();
const session = await authRequest.validateBearerToken();
if (!session) {
	// invalid or expired session
}
```
