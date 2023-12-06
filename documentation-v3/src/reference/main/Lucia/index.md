---
type: "class"
---

The core API.

## Constructor

```ts
//$ Adapter=ref:main
//$ TimeSpan=main
//$ DatabaseSessionAttributes=ref:main
//$ DatabaseUserAttributes=ref:main
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
  - `getSessionAttributes()`: Transforms database session attributes and the returned object is added to the [`Session`](ref:main) object
  - `getUserAttributes()`: Transforms database user attributes and the returned object is added to the [`User`](ref:main) object

## Method

- [`createBlankSessionCookie()`](ref:main/Lucia)
- [`createSession()`](ref:main/Lucia)
- [`createSessionCookie()`](ref:main/Lucia)
- [`getUserSessions()`](ref:main/Lucia)
- [`handleRequest()`](ref:main/Lucia)
- [`createSessionCookie()`](ref:main/Lucia)
- [`invalidateSession()`](ref:main/Lucia)
- [`invalidateUserSessions()`](ref:main/Lucia)
- [`readBearerToken()`](ref:main/Lucia)
- [`readSessionCookie()`](ref:main/Lucia)
- [`validateSession()`](ref:main/Lucia)
