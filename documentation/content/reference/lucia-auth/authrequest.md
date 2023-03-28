---
_order: 1
title: "AuthRequest"
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

## Constructor

```ts
const constructor: (auth: Auth, context: RequestContext) => AuthRequest;
```

#### Parameter

| name    | type                                                         | description    |
| ------- | ------------------------------------------------------------ | -------------- |
| auth    | [`Auth`](/reference/lucia-auth/auth)                         | Lucia instance |
| context | [`RequestContext`](/reference/lucia-auth/types#luciarequest) |                |

## `setSession()`

Sets the session id cookie of the provided session, or if `null`, removes all session cookies. This will NOT invalidate the current session if the input is `null` - this can be down with [`invalidateSession()`](/reference/lucia-auth/auth#invalidatesession).

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

Validates the request, including a CSRF check if enabled (enabled by default), and return the current session. This method will also attempt to renew the session if it was invalid and return the new session if so.

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

Similar to [`validate()`](#validate) but returns both the current session and user in a single database call.

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
