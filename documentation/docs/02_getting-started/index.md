## Installation

```bash
npm install lucia-sveltekit
```

## Setting up Lucia

In `$lib/lucia.ts`, import `lucia` and export it (in this case as `auth`). During this step, lucia requires 3 things: an adapter, a secret key, and the current environment. An adapter connects lucia to your database, secret is used to encrypt and hash your data, and env tells Lucia if it's running in development or production environment. Different adapters are needed for different databases, and it can be easily created if Lucia doesn't provide one.

```js
import lucia from "lucia-sveltekit";
import supabase from "@lucia-sveltekit/adapter-supabase";
import { dev } from "$app/environment";

export const auth = lucia({
    adapter: supabase(),
    secret: "aWmJoT0gOdjh2-Zc2Zv3BTErb29qQNWEunlj",
    env: dev ? "DEV" : "PROD",
});
```

For Lucia to work, its own handle functions must be added to hooks (`/src/hooks/index.js`).

```js
export const handle = auth.handleAuthRequests;
```

This is mainly for 2 things:

1. Automatically refresh tokens on server-side navigation
2. Listen for requests to endpoints that Lucia exposes (creates) for token refresh and sign outs. Make sure to not have existing endpoints that overlaps with them. These endpoints are:
    - /api/auth/refresh
    - /api/auth/logout

Finally, create `/+layout.svelte` and `/+layout.server.js`.

In `/+layout.svelte`, import the `Lucia` wrapper. Access tokens expire in 15 minutes. Lucia will refresh the access token (if expired) on server side navigation using hooks and the wrapper will refresh the token automatically on expiration in the client. This should be placed inside the top layout file.

```tsx
import { Lucia } from "lucia-sveltekit/client";
```

```html
<Lucia>
    <slot />
</Lucia>
```

In `/+layout.server.ts`, create a load function. This makes users' data available both in load functions and in pages.

```ts
import { auth } from "$lib/lucia.js";

export const load = auth.load;
```

Alternatively, it can be used with your own load function like so:

```ts
export const load = async (event) => {
    const loadData = await auth.load(event);
    // do stuff
    return {
        ...loadData,
    };
};
```

## Creating a user

### The basic steps

1. Send the user's input to an endpoint
2. Verify the user's input (check if password is secure, verify the user's email, etc)
3. Create a new user using Lucia
4. Save the cookies returned by Lucia
5. In the client, redirect the user

> When redirecting a user after auth state change (signin, signout), use `window.location.href` in the client or http response redirect in the server instead of SvelteKit's `goto()` as `goto()` will not update the cookies.

### Implementation

`auth.createUser` creates a new user and returns a few tokens and cookies.

The first parameter is the auth id, and the second parameter is the identifier. The third parameter is optional, and you can provide a password and user data to be saved alongside other data. In the example below, `email` will be saved as its own column in the `user` table.

After creating a user, Lucia will return a set of tokens and cookies. These cookies should be saved to the user using the `set-cookie` headers.

```js
export const POST = async () => {
    // ...
    try {
        const createUser = await auth.createUser("email", email, {
            password,
            user_data: {
                email,
            },
        });
        return {
            headers: {
                "set-cookie": createUser.cookies, // set cookies
            },
        };
    } catch {
        // handle errors
    }
};
```

```ts
// for POST actions
export const POST = async ({ setHeaders }) => {
    // ...
    try {
        // same as above
        setHeaders("set-cookie", createUser.cookies)
        return;
    } catch {
        // handle errors
    }
```

## Authenticating a user

### The basic steps

1. Authenticate the user using Lucia
2. Save the cookies returned by Lucia

### Implementation

`auth.authenticateUser` authenticates a user using an identifier and (if necessary) a password.

The first parameter is the auth id and the second parameter is the identifier. The third parameter is the password (if used for that auth id).

```js
export const POST = async () => {
    // ...
    try {
        const authenticateUser = await auth.authenticateUser(
            "email",
            email,
            password
        );
        return {
            headers: {
                "set-cookie": authenticateUser.cookies, // set cookies
            },
        };
    } catch {
        // invalid input
    }
};
```

```ts
// for POST actions
export const POST = async ({ setHeaders }) => {
    // ...
    try {
        // same as above
        setHeaders("set-cookie", createUser.cookies)
        return;
    } catch {
        // handle errors
    }
```

## Checking if the user is authenticated

Lucia adds the following to `session.lucia` if the user if authenticated, and `session.lucia` is `null` if not (refer to: [`SvelteKitSession`](/references/types#sveltekitsession))

```ts
{
    user: User;
    access_token: string;
    refresh_token: string;
}
```

### In the client

```js
import { getSession } from "lucia-sveltekit/client";

const lucia = getSession();

if ($lucia) {
    // authenticated
}
```

### In a load function

```js
export const load = async ({ parent }) => {
    const { lucia } = await parent();
    if (lucia) {
        // authenticated
    }
};
```

### In an endpoint

Lucia provides 2 functions that verifies if a request is valid. **These should not be used interchangeably.**

#### GET and POST requests

The access token should be send as a bearer token in the authorization header.

```js
// endpoint
export const GET = async ({ request }) => {
    try {
        const user = await auth.validateRequest(request);
        // authenticated
    } catch {
        // not authenticated
    }
};
```

```js
// send request
await fetch("/some-endpoint", {
    headers: {
        Authorization: `Bearer ${access_token}`,
    },
});
```

#### GET requests

Can be used for page endpoints. **Do NOT use this for POST requests as it is vulnerable to CSRF attacks**, and it will throw an error if it is not a GET request.

```js
// endpoint
export const GET = async ({ request }) => {
    try {
        const user = await auth.validateRequestByCookie(request);
        // authenticated
    } catch {
        // not authenticated
    }
};
```

```js
// send request
await fetch("/some-endpoint");
```

## Signing out users

```js
import { signOut } from "lucia-sveltekit/client";
import { getSession } from "lucia-sveltekit/client";

const lucia = getSession();

const signOutUser = async () => {
    try {
        await signOut($lucia.access_token);
        window.location.href = "/";
    } catch {
        // handle error
    }
};
```

## Types

`User` and `Session` returned by Lucia's APIs can be typed using the `Lucia` namespace. In `src/app.d.ts`, copy the following:

```ts
declare namespace Lucia {
    interface UserData {}
}
```

Any data inside `Lucia.UserData` will represent `user_data` (`createUser()`) and `UserData` in [types](/references/types).

## Deploying apps

Apps using Lucia cannot be deployed to edge functions (CloudFlare Workers, Vercel Edge Functions, Netlify Edge Functions) due to having a dependency on Node's crypto module. 