---
title: "Login throttling"
description: "Prevent password brute force attacks with login throttling"
---

When implementing password based authentication, a common attack is a brute force attack. While the complexity of the password is likely going to be the most important factor, you can implement login throttling to limit the number of login attempts an attacker can make.

One simple approach is to use exponential backoff to increase the timeout on every unsuccessful login attempt. Since determining the exact origin of an attack is hard, throttling should be done a per-username/account basis. However, an attacker may try to use a common password across multiple accounts. As such, throttling based on IP addresses should be also be considered.

## Basic example

The following example stores the attempts in memory. The timeout doubles on every failed login attempt until the user is successfully authenticated. A [demo](https://github.com/pilcrowOnPaper/lucia/tree/main/examples/other/login-throttling) is available in the repository.

```ts
const usernameThrottling = new Map<
	string,
	{
		timeoutUntil: number;
		timeoutSeconds: number;
	}
>();
```

```ts
const storedThrottling = usernameThrottling.get(username);
const timeoutUntil = storedThrottling?.timeoutUntil ?? 0;
if (Date.now() < timeoutUntil) {
	// 429 too many requests
	throw new Error();
}
const validPassword = validatePassword(username, password);
if (!validPassword) {
	// increase timeout
	const timeoutSeconds = storedThrottling
		? storedThrottling.timeoutSeconds * 2
		: 1;
	usernameThrottling.set(username, {
		timeoutUntil: Date.now() + timeoutSeconds * 1000,
		timeoutSeconds
	});
	// invalid username or password
	throw new Error();
}
usernameThrottling.delete(username);
// success!
```

## Prevent DOS with device cookies

One issue with the basic example above is that a valid user may be locked out if an attacker attempts to sign in. This is of course much better than being susceptible to brute force attacks, but one way to avoid it is to remember users/devices that signed in once and skipping the timeout for the first few attempts.

The following example stores the attempts and valid device cookies in memory. When a user is authenticated, a new device cookie is created. This cookie allows the user to bypass the throttling for the first 5 login attempts if they sign out. A [demo](https://github.com/pilcrowOnPaper/lucia/tree/main/examples/other/login-throtting-device-cookie) is available in the repository.

```ts
const usernameThrottling = new Map<
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
	const storedThrottling = usernameThrottling.get(username) ?? null;
	const timeoutUntil = storedThrottling?.timeoutUntil ?? 0;
	if (Date.now() < timeoutUntil) {
		// 429 too many requests
		throw new Error();
	}
	const validPassword = validatePassword(username, password);
	if (!validPassword) {
		const timeoutSeconds = storedThrottling
			? storedThrottling.timeoutSeconds * 2
			: 1;
		usernameThrottling.set(username, {
			timeoutUntil: Date.now() + timeoutSeconds * 1000,
			timeoutSeconds
		});
		// invalid username or password
		throw new Error();
	}
	usernameThrottling.delete(username);
} else {
	const validPassword = validatePassword(username, password);
	if (!validPassword) {
		// invalid username or password
		throw new Error();
	}
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
