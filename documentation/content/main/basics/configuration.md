---
title: "Configuration"
description: "Learn how to configure Lucia"
---

This page describes all the configuration available for [`lucia()`](/reference/lucia/modules/main#lucia). `MaybePromise` indicates the function can synchronous or asynchronous.

```ts
type Configuration = {
	// required
	adapter:
		| InitializeAdapter<Adapter>
		| {
				user: InitializeAdapter<Adapter>;
				session: InitializeAdapter<SessionAdapter>;
		  };
	env: "DEV" | "PROD";

	// optional
	csrfProtection?:
		| boolean
		| {
				allowedSubdomains: "*" | string[];
		  };
	getSessionAttributes?: (databaseSession: SessionSchema) => Record<any, any>;
	getUserAttributes?: (databaseUser: UserSchema) => Record<any, any>;
	middleware?: Middleware<any>;
	passwordHash?: {
		generate: (password: string) => MaybePromise<string>;
		validate: (
			password: string,
			hashedPassword: string
		) => MaybePromise<boolean>;
	};
	sessionCookie?: {
		name?: string;
		attributes?: SessionCookieAttributes;
		expires?: boolean;
	};
	sessionExpiresIn?: {
		activePeriod: number;
		idlePeriod: number;
	};

	// experimental
	experimental?: {
		debugMode?: boolean;
	};
};
```

## Required

### `adapter`

An adapter (specifically a function that initializes it) for your database. You can use a different adapter for your sessions (session adapters).

```ts
const adapter: InitializeAdapter<Adapter>;
```

```ts
const adapter: {
	user: InitializeAdapter<Adapter>;
	session: InitializeAdapter<SessionAdapter>;
};
```

| type                                | description                         |
| ----------------------------------- | ----------------------------------- |
| `InitializeAdapter<Adapter>`        | Initialize adapter function         |
| `InitializeAdapter<SessionAdapter>` | Initialize session adapter function |

### `env`

Provides Lucia with the current server context.

| value    | description                               |
| -------- | ----------------------------------------- |
| `"DEV"`  | The server is running on HTTP (localhost) |
| `"PROD"` | The server is running on HTTPS            |

## Optional

### `csrfProtection`

`true` by default. When set to `true`, [`AuthRequest.validate()`](/reference/lucia/interfaces/authrequest#validate) checks if the incoming request is from a trusted origin, which by default only includes where the server is hosted. You can define trusted subdomains by adding them to `csrfProtection.allowedSubdomains`. If your app is hosted on `https://foo.example.com`, adding `"bar"` will allow `https://bar.example.com`. You can add `null` in the array to allow urls without a subdomain.

```ts
const csrfProtection = boolean | {
	allowedSubdomains: "*" | (string | null)[]
}
```

| value    | description                         |
| -------- | ----------------------------------- |
| `true`   | CSRF protection enabled             |
| `false`  | CSRF protection disabled            |
| `object` | CSRF protection enabled - see below |

| name                | type              | description                                                                          |
| ------------------- | ----------------- | ------------------------------------------------------------------------------------ |
| `allowedSubdomains` | `"*" \| string[]` | List of allowed subdomains (not full urls/origins) - set to `*` allow all subdomains |

### `getSessionAttributes()`

Generates session attributes for the user. The returned properties will be included in [`Session`](/reference/lucia/interfaces#session) as is.

```ts
const getSessionAttributes: (
	databaseSession: SessionSchema
) => Record<any, any>;
```

##### Parameters

| name              | type                                                         | description                    |
| ----------------- | ------------------------------------------------------------ | ------------------------------ |
| `databaseSession` | [`SessionSchema`](/reference/lucia/interfaces#sessionschema) | Session stored in the database |

##### Returns

| type               |
| ------------------ |
| `Record<any, any>` |

#### Default

```ts
const getSessionAttributes = () => {
	return {};
};
```

### `getUserAttributes()`

Generates user attributes for the user. The returned properties will be included in [`User`](/reference/lucia/interfaces#user) as is.

```ts
const getUserAttributes: (databaseUser: UserSchema) => Record<any, any>;
```

##### Parameters

| name           | type                                                   | description                 |
| -------------- | ------------------------------------------------------ | --------------------------- |
| `databaseUser` | [`UserSchema`](/reference/lucia/interfaces#userschema) | User stored in the database |

##### Returns

| type               |
| ------------------ |
| `Record<any, any>` |

#### Default

```ts
const getUserAttributes = () => {
	return {};
};
```

### `middleware`

```ts
const middleware: Middleware;
```

Lucia middleware for [`Auth.handleRequest()`](/reference/lucia/interfaces/auth#handlerequest). [Learn more about middleware](/basics/handle-requests).

| type                                             | default value                                          |
| ------------------------------------------------ | ------------------------------------------------------ |
| [`Middleware`](/reference/middleware#middleware) | [`lucia()`](/reference/lucia/modules/middleware#lucia) |

### `passwordHash`

By default, passwords are hashed using Scrypt.

```ts
const passwordHash: {
	generate: (password: string) => MaybePromise<string>;
	validate: (password: string, hashedPassword: string) => MaybePromise<boolean>;
};
```

#### `passwordHash.generate()`

Generates a hash for a password synchronously or asynchronously.

##### Parameters

| name       | type     | description          |
| ---------- | -------- | -------------------- |
| `password` | `string` | The password to hash |

##### Returns

| type     | description         |
| -------- | ------------------- |
| `string` | The hashed password |

#### `passwordHash.validate()`

Validates a hash generated using `passwordHash.generate()` synchronously or asynchronously.

##### Parameters

| name           | type     | description                                        |
| -------------- | -------- | -------------------------------------------------- |
| `password`     | `string` | The password to validate                           |
| {passwordHash} | `string` | The password hash to validate the password against |

##### Returns

| value   | description                       |
| ------- | --------------------------------- |
| `true`  | Argument of `password` is valid   |
| `false` | Argument of `password` is invalid |

### `sessionCookie`

```ts
const sessionCookie: {
	name?: string;
	attributes?: SessionCookieAttributes;
	expires: boolean;
};

type SessionCookieAttributes = {
	sameSite?: "lax" | "strict"; // default: "lax"
	path?: string; // default "/""
	domain?: string; // default: undefined
};
```

| property    | type                      | optional | description                                                  |
| ----------- | ------------------------- | :------: | ------------------------------------------------------------ |
| `name`      | `string`                  |    ✓     | Session cookie name                                          |
| `attributes | `SessionCookieAttributes` |    ✓     | Session cookie attributes                                    |
| `expires`   | `boolean`                 |    ✓     | Toggle if session cookie expires or not - enabled by default |

### `sessionExpiresIn`

```ts
const sessionExpiresIn: {
	activePeriod: number;
	idlePeriod: number;
};
```

The active period is the span of time sessions are valid for, while the idle period is span of time since the end of the active period that sessions could be reset (extend expiration).

| property       | type     | description                                                                             | default              |
| -------------- | -------- | --------------------------------------------------------------------------------------- | -------------------- |
| `activePeriod` | `number` | The [active period](/basics/sessions#session-states-and-session-reset) in milliseconds. | 86400000 (1 day)     |
| `idlePeriod    | `number` | The [idle period](/basics/sessions#session-states-and-session-reset) in milliseconds    | 1209600000 (2 weeks) |

## Experimental

Experimental configurations are available in `experimental`.

### `debugMode`

Disabled by default. When debug mode is enabled, Lucia will log key events to the console.

| value   | description         |
| ------- | ------------------- |
| `true`  | Debug mode enabled  |
| `false` | Debug mode disabled |
