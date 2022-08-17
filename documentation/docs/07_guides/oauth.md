This guide will cover how to implement email and password authentication. This will only cover the API parts of it as other parts of Lucia and authentication (like token refresh and protected routes) are explained in [getting started](/getting-started). In addition, this guide will use `+server.ts` syntax but can be adapted to `+page.server.ts`.

## Setting up

### Database

Follow the adapter's instruction. Add a new column called `email` (text/varchar) where the values are unique.

### Github

Go to settings > developer settings and create a new OAuth app. Create 2 apps, one for development and another for production. The callback url should be `https://localhost:3000/api/github` for the development, and `https://YOUR_DOMAIN/api/github` for production.

### Frontend

Make sure to add `scope=user:email` scope to get the user's email.

```ts
const githubClientId = dev ? "DEV_GITHUB_CLIENT_ID" : "PROD_GITHUB_CLIENT_ID";
const githubLink = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&scope=user:email`;
```

```html
<div>
    <h2>Github login</h2>
    <a href="{githubLink}" class="github">Login with Github</a>
</div>
```

The link will send the user to Github's login page and they will be sent to your callback url on a successful attempt.

## Endpoint

Create `routes/api/github.ts` and accept a GET request. If you change this path, make sure to change the callback url. Include your Github OAuth app's id and secret as well.

```ts
import { dev } from "$app/env"; // dev === true if in developmenet
import { auth } from "$lib/lucia.js"; // Lucia instance
import type { RequestHandler } from "@sveltejs/kit";
import type { Error } from "lucia-sveltekit";

const clientId = dev ? "DEV_GITHUB_CLIENT_ID" : "PROD_GITHUB_CLIENT_ID";
const clientSecret = dev
    ? "DEV_GITHUB_CLIENT_SECRET"
    : "PROD_GITHUB_CLIENT_SECRET";

export const GET: RequestHandler = async ({ url }) => {};
```

All codes below will be inside the request handler.

### Retrieving Github access token

Github will send the user to your callback url with a `code` parameter. This code will be used exchange it for an access token.

```ts
const code = url.searchParams.get("code");
if (!code) {
    return new Response(
        JSON.stringify({
            message: "Invalid request url parameters.",
        }),
        {
            status: 400,
        }
    );
}
const getAccessTokenResponse = await fetch(
    `https://github.com/login/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}`,
    {
        method: "POST",
        headers: {
            Accept: "application/json",
        },
    }
);
if (!getAccessTokenResponse.ok) {
    return new Response(
        JSON.stringify({
            message: "Failed to fetch data from Github",
        }),
        {
            status: 500,
        }
    );
}
const getAccessToken = await getAccessTokenResponse.json();
const accessToken = getAccessToken.access_token;
```

### Retieving the user's email

```ts
const getUserEmailsResponse = await fetch(
    "https://api.github.com/user/emails",
    {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    }
);
if (!getUserEmailsResponse.ok) {
    return new Response(
        JSON.stringify({
            message: "Failed to fetch data from Github",
        }),
        {
            status: 500,
        }
    );
}
const emails = (await getUserEmailsResponse.json()) as {
    email: string;
    primary: boolean;
}[];
const email = emails.find((val) => val.primary)?.email || emails[0].email;
```

### Checking if an user exists

Since Lucia does not have a method that creates and authenticates a user at the same time, first check if a user with the email exists. `github` will explained later.

```ts
const user = await auth.getUser("github", email);
```

### Creating a new user

If an existing user does not exist, create a new user with [`createUser`](/server-apis#createuser). `"github"` is the auth id and `email` is the identifier (refer to [overview](/overview) for an explanation on auth ids and identifiers).

We're also going to save the user's email in the `email` column in the `users` table, which can be done using `user_data`. You can also see that we ommited the `password` options for `createUser` since we can trust Github that they have correctly authenticated the user.

Finally, return a response setting the user's cookie and redirects the user to `/`. The `AUTH_DUPLICATE_USER_DATA` error is thrown when a column's unique constraint is violated. This will be useful when we also add an email-password authentication. We want to prevent the user from creating 2 accounts using the same email and this error will be thrown if they attempt to do so.

```ts
if (user) {
    // next step
}
try {
    const createUser = await auth.createUser("github", email, {
        user_data: {
            email,
        },
    });
    return new Response(null, {
        status: 302,
        headers: {
            "set-cookie": createUser.cookies,
            location: "/",
        },
    });
} catch (e) {
    const error = e as Error;
    // violates email column unique constraint
    if (error.message === "AUTH_DUPLICATE_USER_DATA") {
        return new Response(
            JSON.stringify({
                message: "Email already in use",
            }),
            400
        );
    }
    // database connection error
    return new Response(
        JSON.stringify({
            message: "An unknown error occured",
        }),
        {
            status: 500,
        }
    );
}
```

### Authenticating an existing user

Inside the if block, authenticate the user using [`authenticateUser`](/server-apis#authenticateuser). We're going to use the same auth id used when creating our users from Github. Save the cookies and redirect the user.

```ts
if (user) {
    try {
        const authenticateUser = await auth.authenticateUser("github", email);
        return new Response(null, {
            status: 302,
            headers: {
                "set-cookie": authenticateUser.cookies,
                location: "/",
            },
        });
    } catch {
        // Cannot connect to database
        return new Response(
            JSON.stringify({
                message: "An unknown error occured",
            }),
            {
                status: 500,
            }
        );
    }
}
```
