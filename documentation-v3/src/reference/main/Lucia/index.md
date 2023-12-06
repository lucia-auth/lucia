---
type: "class"
---

The core API.

## Constructor

```ts
//$ Middleware=ref:main
//$ Adapter=ref:main
//$ CSRFProtectionOptions=ref:main
//$ TimeSpan=main
//$ SessionCookieOptions=ref:main
//$ DatabaseSessionAttributes=ref:main
//$ DatabaseUserAttributes=ref:main
function constructor<
	_Middleware extends Middleware = $$Middleware<[RequestContext]>,
	_SessionAttributes extends {} = Record<never, never>,
	_UserAttributes extends {} = Record<never, never>
>(
	adapter: $$Adapter,
	options?: {
		middleware?: _Middleware;
		csrfProtection?: boolean | $$CSRFProtectionOptions;
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
  - `middleware`: Middleware
  - `csrfProtection`: If CSRF protection is enabled and its options (default: `true`)
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
