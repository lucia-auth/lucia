---
title: "Lucia"
---

# `Lucia`

## Constructor

```ts
//$ Adapter=/reference/main/Adapter
//$ TimeSpan=/reference/main/TimeSpan
//$ DatabaseSessionAttributes=/reference/main/DatabaseSessionAttributes
//$ DatabaseUserAttributes=/reference/main/DatabaseUserAttributes
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
				sameSite?: "lax" | "strict" | "none";
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

-   `adapter`: Database adapter
-   `options`:
    -   `sessionExpiresIn`: How long a session lasts for inactive users
    -   `sessionCookie`: Session cookie options
        -   `name`: Cookie name (default: `auth_session`)
        -   `expires`: Set to `false` for cookies to persist indefinitely (default: `true`)
        -   `attributes`: Cookie attributes
            -   `sameSite`
            -   `domain`
            -   `path`
            -   `secure`
    -   `getSessionAttributes()`: Transforms database session attributes and the returned object is added to the [`Session`](/reference/main/Session) object
    -   `getUserAttributes()`: Transforms database user attributes and the returned object is added to the [`User`](/reference/main/User) object

## Method

-   [`createBlankSessionCookie()`](/reference/main/Lucia/createBlankSessionCookie)
-   [`createSession()`](/reference/main/Lucia/createSession)
-   [`createSessionCookie()`](/reference/main/Lucia/createSessionCookie)
-   [`deleteExpiredSessions()`](/reference/main/Lucia/deleteExpiredSessions)
-   [`getUserSessions()`](/reference/main/Lucia/getUserSessions)
-   [`handleRequest()`](/reference/main/Lucia/handleRequest)
-   [`createSessionCookie()`](/reference/main/Lucia/createSessionCookie)
-   [`invalidateSession()`](/reference/main/Lucia/invalidateSession)
-   [`invalidateUserSessions()`](/reference/main/Lucia/invalidateUserSessions)
-   [`readBearerToken()`](/reference/main/Lucia/readBearerToken)
-   [`readSessionCookie()`](/reference/main/Lucia/readSessionCookie)
-   [`validateSession()`](/reference/main/Lucia/validateSession)
