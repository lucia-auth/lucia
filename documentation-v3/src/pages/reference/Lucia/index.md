---
layout: "@layouts/ReferenceLayout.astro"
type: "class"
---

The core API.

## Constructor

```ts
//$ Adapter=/reference/Adapter
//$ TimeSpan=/reference/TimeSpan
//$ DatabaseSessionAttributes=/reference/DatabaseSessionAttributes
//$ DatabaseUserAttributes=/reference/DatabaseUserAttributes
function constructor<
	_SessionAttributes extends {} = Record<never, never>,
	_UserAttributes extends {} = Record<never, never>
>(
	adapter: $$Adapter,
	options?: {
		sessionExpiresIn?: $$TimeSpan;
		sessionCookie?: {
			name?: string;
			expires?: boolean;
			attributes: {
				sameSite?: "lax" | "strict";
				domain?: string;
				path?: string;
				secure?: boolean;
			};
		};
		getSessionAttributes?: (
			databaseSessionAttributes: $$DatabaseSessionAttributes
		) => _SessionAttributes;
		getUserAttributes?: (databaseUserAttributes: $$DatabaseUserAttributes) => _UserAttributes;
	}
): this;
```

### Parameters

- `adapter`: Database adapter
- `options`:
  - `sessionExpiresIn`: How long a session lasts for maximum for inactive users
  - `sessionCookie`: Session cookie options
    - `name`: Cookie name (default: `auth_session`)
  - `expires`: Set to `false` for cookies to persist indefinitely (default: `true`)
  - `attributes`: Cookie attributes
    - `sameSite`
    - `domain`
    - `path`
    - `secure`
  - `getSessionAttributes()`: Transforms database session attributes and the returned object is added to the [`Session`](/reference/Session) object
  - `getUserAttributes()`: Transforms database user attributes and the returned object is added to the [`User`](/reference/User) object

## Method

- [`createBlankSessionCookie()`](/reference/Lucia/createBlankSessionCookie)
- [`createSession()`](/reference/Lucia/createSession)
- [`createSessionCookie()`](/reference/Lucia/createSessionCookie)
- [`getUserSessions()`](/reference/Lucia/getUserSessions)
- [`handleRequest()`](/reference/Lucia/handleRequest)
- [`createSessionCookie()`](/reference/Lucia/createSessionCookie)
- [`invalidateSession()`](/reference/Lucia/invalidateSession)
- [`invalidateUserSessions()`](/reference/Lucia/invalidateUserSessions)
- [`readBearerToken()`](/reference/Lucia/readBearerToken)
- [`readSessionCookie()`](/reference/Lucia/readSessionCookie)
- [`validateSession()`](/reference/Lucia/validateSession)
