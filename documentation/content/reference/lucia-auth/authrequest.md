---
_order: 3
title: "`AuthRequest`"
---

Return type of [`handleRequest()`](/reference/lucia-auth/auth#handlerequest).

```ts
type AuthRequest = {
	setSession: (session: Session | null) => void;
	validate: () => Promise<Session | null>;
	validateUser: () => Promise<{
		session: Session;
		user: User;
	} | null>;
};
```

## `setSession()`

Sets the session id cookie of the provided session, or if `null`, removes the current session cookies. **The current session will NOT be invalidated in this case** - this can be down with [`invalidateSession()`](/reference/lucia-auth/auth#invalidatesession). It will invalidate the cached user object.

```ts
const setSession: (session: Session | null) => void;
```

#### Parameter

| name    | type                                                       | description        |
| ------- | ---------------------------------------------------------- | ------------------ |
| session | [`Session`](/reference/lucia-auth/types#session)` \| null` | the session to set |

#### Example

```ts
import { auth } from "../lucia";

const authRequest = auth.handleRequest();
const session = await auth.createSession();
authRequest.setSession(session); // set session cookie
```

```ts
import { auth } from "../lucia";

const authRequest = new AuthRequest();
await auth.invalidateSession(sessionId); // invalidate session
authRequest.setSession(null); // remove session cookies
```

## `validate()`

Similar to `validateUser()` but only return the session.

```ts
const validate: () => Promise<Session | null>;
```

#### Returns

| type                                                       | description               |
| ---------------------------------------------------------- | ------------------------- |
| [`Session`](/reference/lucia-auth/types#session)` \| null` | `null` if unauthenticated |

#### Example

```ts
const authRequest = new AuthRequest();
const session = await authRequest.validate();
if (session) {
	// authenticated
}
```

## `validateUser()`

Validates the request, including a CSRF check if enabled (enabled by default), and return the current session and user. This method will also attempt to renew the session if it was invalid and return the new session if so.

```ts
const validate: () => Promise<{
	session: Session;
	user: User;
} | null>;
```

#### Returns

| name    | type                                                       | description               |
| ------- | ---------------------------------------------------------- | ------------------------- |
| session | [`Session`](/reference/lucia-auth/types#session)` \| null` | `null` if unauthenticated |
| user    | [`User`](/reference/lucia-auth/types#user)` \| null`       | `null` if unauthenticated |

#### Example

```ts
const authRequest = new AuthRequest();
const { session, user } = await authRequest.validateUser();
if (session) {
	// authenticated
}
```
