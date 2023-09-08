---
title: "Improving session security"
description: "Learn how to configure and extend Lucia to improve security"
---

What can be considered "secure enough" really differs from application to application. Improving security often comes with the tradeoff of impacting usability, and it's up to you to decide whether that's worth it. As such, while Lucia provides a good baseline, you may need to configure and extend Lucia to meet your requirements.

## Session cookies

By default, session cookies are set to `SameSite: Lax`, not `Strict`. This provides a good balance between CSRF protection and usability since your users will be logged if they visit your site via link. However, if that doesn't apply to your site (e.g. banks), you can configure session cookies to use `SameSite: Strict` with the `sessionCookie` configuration.

```ts
lucia({
	// ...
	sessionCookie: {
		attributes: {
			sameSite: "strict"
		}
	}
});
```

## Adjust expiration for inactive users

Sessions will continue to be valid as long as they're used at least once every 2 weeks. This allows sessions to be persisted for active users, while invalidating them for inactive users. You can configure sessions to be invalidated as quick as possible without interrupting active users with the `sessionExpiresIn` configuration. See the [Session](/basics/sessions#session-states-and-session-reset) docs for more on session states.

```ts
lucia({
	// ...
	// sessions will expire within 30 minutes (max) since inactivity
	sessionExpiresIn: {
		activePeriod: 1000 * 60 * 15, // 15 minutes
		idlePeriod: 1000 * 60 * 15 // 15 minutes
	}
});
```

## Absolute session expiration

Sessions do not have a fixed expiration and will continue to be valid as long as its used. While absolute expiration is not provided by Lucia, this can be easily implemented using custom attributes.

```ts
lucia({
	getSessionAttributes: (data) => {
		return {
			absoluteExpiration: data.absolute_expiration as Date
		};
	}
});
```

```ts
await auth.createSession({
	userId,
	attributes: {
		absolute_expiration: Date.now() + 1000 * 60 * 60 * 12 // valid for 12 hours
	}
});
```

```ts
import { isWithinExpiration } from "lucia/utils";

const authRequest = auth.handleRequest();
const session = await authRequest.validate();
if (!session || !isWithinExpiration(session.absoluteExpiration.getTime())) {
	// invalid session
}
```

## Detect stolen sessions

There are few ways to detect if a session cookie is being used by a different device/person. All these approaches are imperfect in some way but provide a good layer of security. See each hosting provider's documentation on custom headers:

- [Cloudflare](https://developers.cloudflare.com/fundamentals/reference/http-request-headers)
- [Vercel](https://vercel.com/docs/edge-network/headers)

### IP addresses

You can just store the IP address, but since IP addresses is usually dynamic (especially for cellular), you may want to consider storing the general location determined from the IP address instead.

```ts
lucia({
	// ...
	getSessionAttributes: (data) => {
		return {
			countryCode: data.country_code as string
		};
	}
});
```

```ts
const countryCode = getCountryCodeFromRequest(request);
await auth.createSession({
	userId,
	country_code: countryCode
});
```

```ts
const countryCode = getCountryCodeFromRequest(request);

const authRequest = auth.handleRequest();
const session = await authRequest.validate();
if (!session || session.countryCode !== countryCode) {
	// invalid session
}
```

### User agent

The `User-Agent` header includes information about the browser and the device of the client. You can optionally combine it with the IP address or the country code of the IP address to get a more unique id. Before relying on it too much, keep in mind that headers can be easily spoofed

You can hash the value with a fixed length algorithm to save on storage.

```ts
lucia({
	// ...
	getSessionAttributes: (data) => {
		return {
			userAgentHash: data.user_agent_hash as string
		};
	}
});
```

```ts
const userAgent = request.headers.get("User-Agent") ?? ""; // optionally throw error if `null`
const userAgentHash = md5(userAgent);
await auth.createSession({
	userId,
	attributes: {
		user_agent_hash: userAgentHash
	}
});
```

```ts
const userAgent = request.headers.get("User-Agent") ?? ""; // optionally throw error if `null`
const userAgentHash = md5(userAgent);

const authRequest = auth.handleRequest();
const session = await authRequest.validate();
if (!session || session.userAgentHash !== userAgentHash) {
	// invalid session
}
```
