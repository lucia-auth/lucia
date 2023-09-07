---
title: "Login throttling"
description: "Prevent password brute force attacks with login throttling"
---

When implementing password based authentication, a common attack is a brute force attack. While the complexity of the password is likely going to be the most important factor, you can implement login throttling to limit the number of login attempts an attacker can make.

One simple approach is to use exponential backoff to increase the timeout on every unsuccessful login attempt. Since determining the exact origin of an attack is hard, throttling should be done on a per-username/account basis. However, an attacker may try to use a common password across multiple accounts. As such, throttling based on IP addresses should also be considered.

## Basic example

The following example stores the attempts in memory. You can of course use a regular database but running it in within a transaction is recommended. The timeout doubles on every failed login attempt until the user is successfully authenticated. A [demo](https://github.com/pilcrowOnPaper/lucia/tree/main/examples/other/login-throttling) is available in the repository.

```ts
const loginTimeout = new Map<
	string,
	{
		timeoutUntil: number;
		timeoutSeconds: number;
	}
>();
```

```ts
// for traditional databases - START TRANSACTION
const storedTimeout = loginTimeout.get(username);
const timeoutUntil = storedTimeout?.timeoutUntil ?? 0;
if (Date.now() < timeoutUntil) {
	// 429 too many requests
	throw new Error();
}
// increase timeout
const timeoutSeconds = storedTimeout ? storedTimeout.timeoutSeconds * 2 : 1;
loginTimeout.set(username, {
	timeoutUntil: Date.now() + timeoutSeconds * 1000,
	timeoutSeconds
});
// for traditional databases - END TRANSACTION

try {
	await auth.validateKeyPassword("username", username, password);
	loginTimeout.delete(username);
	// success!
} catch {
	// invalid username or password
	throw new Error();
}
```

## Prevent DOS with device cookies

One issue with the basic example above is that a valid user may be locked out if an attacker attempts to sign in. This is of course much better than being susceptible to brute force attacks, but one way to avoid it is to remember users/devices that signed in once and skipping the timeout for the first few attempts.

The following example stores the attempts and valid device cookies in memory. When a user is authenticated, a new device cookie is created. This cookie allows the user to bypass the throttling for the first 5 login attempts if they sign out. A [demo](https://github.com/pilcrowOnPaper/lucia/tree/main/examples/other/login-throtting-device-cookie) is available in the repository.

```ts
const loginTimeout = new Map<
	string,
	{
		timeoutUntil: number;
		timeoutSeconds: number;
	}
>();

const deviceCookie = new Map<
	string,
	{
		username: string;
		attempts: number;
	}
>();
```

```ts
const storedDeviceCookieId = getCookie("device_cookie") ?? null;
const validDeviceCookie = isValidateDeviceCookie(
	storedDeviceCookieId,
	username
);
if (!validDeviceCookie) {
	setCookie("device_cookie", "", {
		path: "/",
		secure: false, // true for production
		maxAge: 0,
		httpOnly: true
	});
	const storedTimeout = loginTimeout.get(username) ?? null;
	const timeoutUntil = storedTimeout?.timeoutUntil ?? 0;
	if (Date.now() < timeoutUntil) {
		// 429 too many requests
		throw new Error();
	}
	const timeoutSeconds = storedTimeout ? storedTimeout.timeoutSeconds * 2 : 1;
	loginTimeout.set(username, {
		timeoutUntil: Date.now() + timeoutSeconds * 1000,
		timeoutSeconds
	});
	await auth.validateKeyPassword("username", username, password);
	loginTimeout.delete(username);
} else {
	await auth.validateKeyPassword("username", username, password);
}

const newDeviceCookieId = generateRandomString(40);
deviceCookie.set(newDeviceCookieId, {
	username,
	attempts: 0
});
setCookie("device_cookie", newDeviceCookieId, {
	path: "/",
	secure: false, // true for production
	maxAge: 60 * 60 * 24 * 365, // 1 year
	httpOnly: true
});
// success!
```

```ts
const isValidateDeviceCookie = (
	deviceCookieId: string | null,
	username: string
) => {
	if (!deviceCookieId) return false;
	const deviceCookieAttributes = deviceCookie.get(deviceCookieId) ?? null;
	if (!deviceCookieAttributes) return false;
	const currentAttempts = deviceCookieAttributes.attempts + 1;
	if (currentAttempts > 5 || deviceCookieAttributes.username !== username) {
		deviceCookie.delete(deviceCookieId);
		return false;
	}
	deviceCookie.set(deviceCookieId, {
		username,
		attempts: currentAttempts
	});
	return true;
};
```
