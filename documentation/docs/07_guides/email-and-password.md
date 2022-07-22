This guide will cover how to implement email and password authentication. This will only cover the sign-in part of it as other parts of Lucia and authentication (like token refresh and protected routes) are explained in [getting started](/getting-started).

## Setting up

### Database

Follow the adapter's instruction. Add a new column called `email` (text/varchar) where the values are unique.

### Frontend

Send a POST request to the signup or login endpoint with a JSON body.

```ts
const signup = async () => {
    await fetch("/api/signup", {
        method: "POST",
        body: JSON.stringify({
            email,
            password,
        }),
    });
};
```

## Sign up

Create `routes/api/signup.ts` and accept a POST request. Get the email and password from the body data.

```ts
import type { RequestHandler } from "@sveltejs/kit";
import { auth } from "$lib/lucia";

export const POST: RequestHandler = async ({ request }) => {
    const { email, password } = await request.json();
    if (!email || !password) {
        return {
            status: 400,
        };
    }
};
```

### Create a new user

Create a new user using [`createUser`](/server-apis#createuser) using the auth id of `email` and an identifier of `email` (refer to [overview](/overview) for an explanation on auth ids and identifiers). Save the user's password using the password options and the user's email using `user_data`. Set the cookies (refresh, access, and fingerprint token) and redirect the user in the response. The `AUTH_DUPLICATE_IDENTIFER_TOKEN` error is thrown when a user tries to create a new account using the same auth id and identifer (in this case, email).

```ts
try {
    const createUser = await auth.createUser("email", email, {
        password,
        user_data: {
            email,
        },
    });
    return {
        status: 302,
        headers: {
            "set-cookie": createUser.cookies,
            location: "/",
        },
    };
} catch (e) {
    const error = e as Error;
    if (
        error.message === "AUTH_DUPLICATE_IDENTIFER_TOKEN" ||
        error.message === "AUTH_DUPLICATE_USER_DATA"
    ) {
        return {
            status: 400,
            body: JSON.stringify({
                error: "Email already in use.",
            }),
        };
    }
    return {
        status: 500,
        body: JSON.stringify({
            error: "Unknown error.",
        }),
    };
}
```

## Sign in

Create `routes/api/login.ts` and accept a POST request. Get the user's email and password from the body.

```ts
import type { RequestHandler } from "@sveltejs/kit";
import { auth } from "$lib/lucia";

export const POST: RequestHandler = async ({ request }) => {
    const form = await request.formData();
    const email = form.get("email")?.toString();
    const password = form.get("password")?.toString();
    if (!email || !password) {
        return {
            status: 400,
        };
    }
};
```

### Authenticate a user

Authenticate the user using [`authenticateUser`](/server-apis#authenticateuser), which will require a password this time. It's important to NOT tell the user if the email was incorrect or if the password was incorrect.

```ts
try {
    const authenticateUser = await auth.authenticateUser(
        "email",
        email,
        password
    );
    return {
        status: 302,
        headers: {
            "set-cookie": createUser.cookies,
            location: "/",
        },
    };
} catch (e) {
    const error = e as Error;
    if (
        error.message === "AUTH_INVALID_IDENTIFIER_TOKEN" ||
        error.message === "AUTH_INVALID_PASSWORD"
    ) {
        return {
            status: 400,
            body: JSON.stringify({
                error: "Incorrect email or password.",
            }),
        };
    }
    // database connection error
    return {
        status: 500,
        body: JSON.stringify({
            error: "Unknown error.",
        }),
    };
}
```
