---
title: "AuthRequest"
format: "code"
---

On initialization, it will check the request origin with [`Auth.validateRequestOrigin()`](/reference/lucia/interfaces/auth#validaterequestorigin). If the request is from an untrusted origin, it will ignore all cookies sent with the request. This can be disabled with [`csrfProtection`](/basics/configuration#csrfprotection) configuration.

## `setSession()`

Sets a session cookie. Providing `null` will create a blank session cookie that will delete the current one.

```ts
const setSession: (session: Session | null) => void;
```

##### Parameters

| name      | type                                                      | description      |
| --------- | --------------------------------------------------------- | ---------------- |
| `session` | [`Session`](/reference/lucia/interfaces#session)`\| null` | Session to store |

#### Example

```ts
import { auth } from "./lucia.js";

const authRequest = auth.handleRequest();
authRequest.setSession(session);
authRequest.setSession(null); // delete session cookie
```

## `validate()`

Validates the session cookie using [`Auth.validateSession()`](/reference/lucia/interfaces/auth#validatesession). This resets the session if its idle, and returns the validated session if the cookie is valid, or `null` if not, Additionally, when a session is reset, a new session cookie is set.

By default, this method will also return `null` if the request is from an untrusted origin.

```ts
const validate: () => Promise<Session | null>;
```

##### Returns

| type                                             | description                   |
| ------------------------------------------------ | ----------------------------- |
| [`Session`](/reference/lucia/interfaces#session) | The validated session         |
| `null`                                           | The session stored is invalid |

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

Validates the session cookie using [`Auth.validateSession()`](/reference/lucia/interfaces/auth#validatesession. This resets the session if its idle, and returns the validated session if the token is valid, or `null` if not,

```ts
const validateBearerToken: () => Promise<Session | null>;
```

##### Returns

| type                                             | description            |
| ------------------------------------------------ | ---------------------- |
| [`Session`](/reference/lucia/interfaces#session) | The validated session  |
| `null`                                           | The session is invalid |

#### Example

```ts
import { auth } from "./lucia.js";

const authRequest = auth.handleRequest();
const session = await authRequest.validateBearerToken();
if (session) {
	// valid session
}
```
