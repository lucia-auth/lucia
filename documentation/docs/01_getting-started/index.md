## Installation

```bash
npm install lucia-sveltekit
```

## Setting up Lucia

In `$lib/lucia.js`, import `lucia` and export it (in this case as `auth`). During this step, lucia requires 2 things: an adapter and a secret. An adapter connects lucia to your database, and secret is used to encrypt and hash your data. Different adapters are needed for different databases, and can be easily created if Lucia doesn't provide it.

```js
import lucia from "lucia-sveltekit";
import supabase from "@lucia-sveltekit/adapter-supabase";

export const auth = lucia({
    adapter: supabase(),
    secret: "aWmJoT0gOdjh2-Zc2Zv3BTErb29qQNWEunlj",
});
```

For Lucia to work, it needs to intercept requests

```js
export handle = auth.authHandle
export getSession = auth.getAuthSession
```

## Creating a user

### The basic steps

1. Send the user's input to an endpoint
2. Verify the user's input (check if password is secure, verify the user's email, etc)
3. Create a new user using Lucia
4. Save the cookies returned by Lucia
5. In the client, redirect the user

> When redirecting a user after auth state change (signin, signout), use `window.location.href` instead of SvelteKit's `goto()` as `goto()` will not update the cookies.

### Implementation

`auth.createUser` creates a new user and returns a few tokens and cookies.

The first parameter is the auth id, and the second parameter is the identifier. The third paramter is optional, and you can provide a password and user data to be saved alongside other data. In the example below, `email` will be saved as its own column in the `users` table.

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
                "set-cookie": createUser.cookies.all, // set cookeis
            },
        };
    } catch {
        // handle errors
    }
};
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
                "set-cookie": authenticateUser.cookies.all, // set cookeis
            },
        };
    } catch {
        // invalid input
    }
};
```

## Checking if the user is authenticated

Lucia adds the following to `session.lucia` if the user if authenticated, and `session.lucia` is `null` if not.

```ts
{
    user: LuciaUser;
    access_token: string;
    refresh_token: string;
}
```

### In the client

```js
import { session } from "$app/stores";

if ($session.lucia) {
    // authenticated
}
```

### In a load function

```js
export const load = async ({ session }) => {
    if (session.lucia) {
        // authenticated
    }
};
```

### In an endpoint

Lucia provides a function that verifies if a request is valid. The access token should be send as a bearer token in the authorization header. Lucia does not rely on http-only cookies to verify the user in endpoints to prevent CSRF attacks.

```js
export const GET = async ({ request }) => {
    try {
        const user = await auth.getUserFromRequest(request);
        // authenticated
    } catch {
        // not authenticated
    }
};
```

## Refreshing the access token

Access tokens expire in 15 minutes. Lucia will refresh the access token (if expired) on server side navigation but not on client side navigation. Lucia provides `autoRefreshAccessToken()` that refreshes the token automatically on expiration in the client and relies on `$session.lucia` to exist. It returns a unsubscribe function that should be called on page/componenet destroy.

```js
import { autoRefreshAccessToken } from "lucia-sveltekit/client";
import { session } from "$app/stores";

const unsubscribe = autoRefreshAccessToken(session);

onDestroy(() => {
    unsubscribe();
});
```

## Signing out users

```js
import { signOut } from "lucia-sveltekit/client";
const signOutUser = async () => {
    try {
        await signOut()
        window.location.href = "/"
    } catch {
        // handle error
    }
};
```
