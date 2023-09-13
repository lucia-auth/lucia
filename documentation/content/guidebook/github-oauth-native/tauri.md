---
title: "Github OAuth in Tauri"
description: "Learn how to implement Github OAuth in Tauri desktop applications"
---

_These guides are not beginner friendly and do not cover the basics of Lucia. We recommend reading the [Github OAuth](http://localhost:3000/guidebook/github-oauth) guide for regular websites first._

We'll be using bearer tokens instead of cookies to validate users. For the most part, authenticating the user is identical to regular web applications. The user is redirected to Github, then back to your server with a `code`, which is then exchanged for an access token, and a new user/session is created. The hard part is sending the session token (ie. session id) from the server back to our application.

One option is to use a deep-links, but getting that to work in a dev environment is tricky and isn't officially supported in Tauri. Another option is to open the Github authorization url in a webview window, which would allow us to intercept navigation and read urls (where we can store the session id). However, since a webview window is in its own isolated context, the user would have to enter their Github username/password every time.

The strategy we'll be using is to create a super basic local server in the background. After creating a session, the server can redirect the user to the localhost server with the session token.

### Clone project

You can get started immediately by cloning the [example](https://github.com/pilcrowOnPaper/lucia/tree/main/examples/tauri/github-oauth) from the repository.

```
npx degit pilcrowonpaper/lucia/examples/tauri/github-oauth <directory_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/pilcrowOnPaper/lucia/tree/main/examples/tauri/github-oauth).

## Server

Make sure you've installed `lucia` and `@lucia-auth/oauth`, create 4 API routes:

- GET `/user`: Returns the current user
- GET `/login/github`: Redirects the user to the Github authorization url
- GET `/login/github/callback`: Handles callback from Github and redirects the user to the localhost server with the session id
- POST `/logout`: Handles logouts

This example uses [Hono](https://hono.dev) but you should be able to easily convert it to whatever framework you use.

There are few key differences between the code for regular web applications. First, we'll be using bearer tokens instead of cookies. As such, [`AuthRequest.validateBearerToken()`](/reference/lucia/interfaces/authrequest#validatebearertoken) is used instead of `AuthRequest.validate()`. We're also passing a `port` to `/login/github`. This is the port number of the localhost server created by the app (determined at runtime), and it will used for the callback url;

```ts
import { lucia } from "lucia";
import { github } from "@lucia-auth/oauth/providers";

export const auth = lucia({
	// ...
});

export type Auth = typeof auth;

export const githubAuth = github(auth, {
	clientId,
	clientSecret
});
```

```ts
import { auth, githubAuth } from "./auth";
import { OAuthRequestError } from "@lucia-auth/oauth";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";

const app = new Hono();

app.get("/user", async (c) => {
	const authRequest = auth.handleRequest(c);
	const session = await authRequest.validateBearerToken();
	if (!session) {
		return c.newResponse(null, 401);
	}
	return c.json(session.user);
});

app.get("/login/github", async (c) => {
	const url = new URL(c.req.url);
	const port = url.searchParams.get("port");
	if (!port) return c.newResponse(null, 400);
	const [authorizationUrl, state] = await githubAuth.getAuthorizationUrl();
	setCookie(c, "github_oauth_state", state, {
		path: "/",
		maxAge: 60 * 10,
		httpOnly: true,
		secure: process.env.NODE_ENV === "production"
	});
	setCookie(c, "redirect_port", port, {
		path: "/",
		maxAge: 60 * 10,
		httpOnly: true,
		secure: process.env.NODE_ENV === "production"
	});
	return c.redirect(authorizationUrl.toString());
});

app.get("/login/github/callback", async (c) => {
	const url = new URL(c.req.url);
	const code = url.searchParams.get("code");
	if (!code) return c.newResponse(null, 400);
	const state = url.searchParams.get("state");
	const storedState = getCookie(c, "github_oauth_state");
	if (!state || !storedState || state !== storedState) {
		return c.newResponse(null, 400);
	}
	const redirectPort = getCookie(c, "redirect_port");
	if (!redirectPort) return c.newResponse(null, 400);
	try {
		const { getExistingUser, githubUser, createUser } =
			await githubAuth.validateCallback(code);
		let user = await getExistingUser();
		if (!user) {
			user = await createUser({
				attributes: {
					username: githubUser.login
				}
			});
		}
		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});
		return c.redirect(
			`http://localhost:${redirectPort}?session_token=${session.sessionId}`
		);
	} catch (e) {
		console.log(e);
		if (e instanceof OAuthRequestError) {
			// invalid code
			return c.newResponse(null, 400);
		}
		return c.newResponse(null, 500);
	}
});

app.post("/logout", async (c) => {
	const authRequest = auth.handleRequest(c);
	const session = await authRequest.validateBearerToken();
	if (!session) return c.newResponse(null, 401);
	await auth.invalidateSession(session.sessionId);
	return c.newResponse(null, 200);
});

serve(app);
```

## App

### Setup

Update your `allowlist` to include `shell.open` and `http.request`. Make sure to add your server url to `http.scope` array.

```json
// tauri.conf.json
{
	"tauri": {
		"allowlist": {
			"shell": {
				"open": true
			},
			"http": {
				"request": true,
				"scope": [" http://localhost:3000/*"] // wherever you server is hosted
			}
		}
		// ...
	}
	// ...
}
```

In `src-tauri`, install `tokio`.

```toml
# Cargo.toml
[dependencies]
# ...
tokio = { version = "1.32.0", features = ["net"] }
```

### Frontend

We first define 3 basic functions:

- `signInWithGithub()`: Mostly a wrapper for Rust code. Waits for the session id and gets the user object.
- `signOut()`: Calls `/logout` to sign out the user
- `getUser()`: Calls `/user` to get the current user

While storing tokens in local storage isn't the most optimal, it should be fine for now.

```ts
// src/main.ts
import { invoke } from "@tauri-apps/api/tauri";
import { getClient, ResponseType } from "@tauri-apps/api/http";

const signInWithGithub = async () => {
	try {
		// call `authenticate()` internal function (see next section)
		// this opens a new browser tab to authenticate with Github
		// and listens for the callback from the server
		const sessionToken = await invoke<string>("authenticate");
		localStorage.setItem("session_token", sessionToken);
		const user = await getUser(sessionToken);
		// ...
	} catch (e) {
		console.log(e);
	}
};

const signOut = async () => {
	const sessionToken = localStorage.getItem("session_token");
	if (!sessionToken) return;
	const client = await getClient();
	const response = await client.request({
		url: "http://localhost:3000/logout",
		method: "POST",
		headers: {
			Authorization: `Bearer ${sessionToken}`
		}
	});
	if (!response.ok) return;
	localStorage.removeItem("session_token");
};

const getUser = async (sessionToken: string): Promise<User | null> => {
	const client = await getClient();
	const response = await client.get<User>("http://localhost:3000/user", {
		headers: {
			Authorization: `Bearer ${sessionToken}` // remember to send your session id as bearer token
		},
		responseType: ResponseType.JSON
	});
	if (!response.ok) {
		localStorage.removeItem("session_token");
		return null;
	}
	return response.data;
};

type User = {
	userId: string;
	username: string;
};
```

### Internals

> Note: The author of this library has very limited experience with Rust. If you have any suggestions, please open a new issue or PR.

`authenticate()` will create a new HTTP server locally. This will listen for a request, which will indicate that a user has successfully signed in, and the session id will be stored in the query string.

We're not looping over the listener since we only except the user to visit this page once.

```rust
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::api::shell;
use tauri::{AppHandle, Manager};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::net::TcpListener;

#[tauri::command]
async fn authenticate(app_handle: AppHandle) -> Result<String, String> {
    // create new server
    // port 0 = let the computer find an unused port
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let port = listener.local_addr().unwrap().port();
    // open the /login page with the default browser
    shell::open(
        &app_handle.shell_scope(),
        format!("http://localhost:3000/login/github?port={}", port),
        None,
    )
    .unwrap();
    // wait until incoming request
    let (mut stream, _) = listener.accept().await.unwrap();
    let (reader, writer) = stream.split();
    let mut buf_reader = BufReader::new(reader);
    let mut buf = String::new();
    // get first line of request message
    buf_reader.read_line(&mut buf).await.unwrap();
    // get url (2nd item)
    let url = buf.split_ascii_whitespace().nth(1).unwrap();
    // get query string
    let (_, query) = url.split_once('?').unwrap_or_default();
    for query_pair in query.split('&') {
        // parse query string and find `session_token`
        if let Some(("session_token", value)) = query_pair.split_once('=') {
            // send a success message
            // you can optionally send a redirect response to a proper success page
            // or even a deep/universal link to open the application
            writer
                .try_write(
                    b"HTTP/1.1 200 OK\r\n\r\nSuccessfully logged in. You can now close this tab.",
                )
                .unwrap();
            // return session id as session token
            return Ok(value.to_string());
        }
    }
    Err("Missing session".to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![authenticate])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

#### Request message

A standard request message looks like this:

```
GET /path?key=value HTTP/1.1
Host: localhost:3000
User-Agent: lucia

<h1>body</h1>
```
