This guide will cover how to implement email and password authentication. This will only cover the API parts of it as other parts of Lucia and authentication (like token refresh and protected routes) are explained in [getting started](/getting-started). In addition, this guide will use `+server.ts` syntax but can be adapted to `+page.server.ts`.

## Set up

### Database

Follow the adapter's instruction. Add a new column called `email` (text/varchar) where the values are unique.

### Page

Create a form that takes in email and password, one in the sign up page and another in the login page.

```html
<form method="post">
    <label for="email">email</label>
    <input type="text" name="email" id="email" />
    <label for="password">password</label>
    <input type="password" name="password" id="password" />
    <input type="submit" />
</form>
```

## Sign up

Create `+page.server.ts` in the same route folder as the sign up page and accept a POST request. Get the email and password from the form data.

```ts
import { type Actions, invalid, redirect } from "@sveltejs/kit";
import { auth } from "$lib/lucia";
import { setCookie } from "lucia-sveltekit";

export const actions: Actions = {
    default: async ({ cookies, request }) => {
        const form = await request.formData();
        const email = form.get("email")?.toString() || "";
        const password = form.get("password")?.toString() || "";
        if (!email || !password) {
            throw invalid(400, {
                message: "Missing input",
            });
        }
        // ...
    },
};
```

### Create a new user

Create a new user using [`createUser`](/server-apis#createuser) using the auth id of `email` and an identifier of `email` (refer to the [overview](/overview) page for an explanation on auth ids and identifiers). Save the user's password using the password options and the user's email using `user_data`. Set the cookies (refresh, access, and fingerprint token) and redirect the user in the response. The `AUTH_DUPLICATE_IDENTIFIER_TOKEN` error is thrown when a user tries to create a new account using the same auth id and identifier (in this case, email).

```ts
import { type Actions, invalid, redirect } from "@sveltejs/kit";
import { auth } from "$lib/lucia";
import { setCookie } from "lucia-sveltekit";

export const actions: Actions = {
    default: async ({ cookies, request }) => {
        // ...
        try {
            const userSession = await auth.createUser("email", email, {
                password,
                user_data: {
                    email,
                },
            });
            setCookie(cookies, ...userSession.cookies);
            throw redirect(302, "/"); // redirect to protected page
        } catch (e) {
            const error = e as Error;
            if (
                error.message === "AUTH_INVALID_IDENTIFIER_TOKEN" ||
                error.message === "AUTH_INVALID_PASSWORD"
            ) {
                throw invalid(400, {
                    message: "Incorrect email or password",
                });
            }
            // database connection error
            throw invalid(400, {
                message: "Unknown error",
            });
        }
    },
};
```

## Sign in

Create `+page.server.ts` in the same route folder as the login page and accept POST requests. Get the user's email and password from the body.

```ts
import { type Actions, invalid, redirect } from "@sveltejs/kit";
import { auth } from "$lib/lucia";
import { setCookie } from "lucia-sveltekit";

export const actions: Actions = {
    default: async ({ cookies, request }) => {
        const form = await request.formData();
        const email = form.get("email")?.toString() || "";
        const password = form.get("password")?.toString() || "";
        if (!email || !password) {
            throw invalid(400, {
                message: "Missing input",
            });
        }
        // ...
    },
};
```

### Authenticate a user

Authenticate the user using [`authenticateUser`](/server-apis#authenticateuser), which will require a password this time. It's important to NOT tell the user if the email was incorrect or if the password was incorrect.

```ts
import { type Actions, invalid, redirect } from "@sveltejs/kit";
import { auth } from "$lib/lucia";
import { setCookie } from "lucia-sveltekit";

export const actions: Actions = {
    default: async ({ cookies, request }) => {
        // ...
        try {
            const userSession = await auth.authenticateUser(
                "email",
                email,
                password
            );
            setCookie(cookies, ...userSession.cookies);
            throw redirect(302, "/"); // redirect to protected page
        } catch (e) {
            const error = e as Error;
            if (
                error.message === "AUTH_INVALID_IDENTIFIER_TOKEN" ||
                error.message === "AUTH_INVALID_PASSWORD"
            ) {
                throw invalid(400, {
                    message: "Incorrect email or password",
                });
            }
            // database connection error
            throw invalid(400, {
                message: "Unknown error",
            });
        }
    },
};
```
