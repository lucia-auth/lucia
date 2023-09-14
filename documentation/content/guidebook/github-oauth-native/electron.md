---
title: "Github OAuth in Electron"
description: "Learn how to implement Github OAuth in Electron desktop applications"
---

> These guides are not beginner friendly and do not cover the basics of Lucia. We recommend reading the [Github OAuth](http://localhost:3000/guidebook/github-oauth) guide for regular websites first.

We'll be using bearer tokens instead of cookies to validate users. For the most part, authenticating the user is identical to regular web applications. The user is redirected to Github, then back to your server with a `code`, which is then exchanged for an access token, and a new user/session is created.

To send the session token (ie. session id) from the server back to our application, we'll be using deep-links which allow us to open applications using a url.

### Clone project

You can get started immediately by cloning the [example](https://github.com/pilcrowOnPaper/lucia/tree/main/examples/electron/github-oauth) from the repository.

```
npx degit pilcrowonpaper/lucia/examples/electron/github-oauth <directory_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/pilcrowOnPaper/lucia/tree/main/examples/electron/github-oauth).

## Server

Make sure you've installed `lucia` and `@lucia-auth/oauth`, create 4 API routes:

- GET `/user`: Returns the current user
- GET `/login/github`: Redirects the user to the Github authorization url
- GET `/login/github/callback`: Handles callback from Github and redirects the user to the localhost server with the session id
- POST `/logout`: Handles logouts

This example uses [Hono](https://hono.dev) but you should be able to easily convert it to whatever framework you use.

There are few key differences between the code for regular web applications. First, we'll be using bearer tokens instead of cookies. As such, [`AuthRequest.validateBearerToken()`](/reference/lucia/interfaces/authrequest#validatebearertoken) is used instead of `AuthRequest.validate()`. We'll send the user back to the application with a deep-link, where the session token is stored as a search params. The guide uses `electron-app` protocol as an example, but you can configure it in your Electron application.

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
	const [authorizationUrl, state] = await githubAuth.getAuthorizationUrl();
	setCookie(c, "github_oauth_state", state, {
		path: "/",
		maxAge: 60 * 10, // 10 min
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
			`electron-app://login?session_token=${session.sessionId}`
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

## Electron app

This example uses [Electron Forge](https://www.electronforge.io), which currently is the recommended way to package Electron apps.

### Setup deep linking

In `forge.config.ts`, update `packagerConfig.protocols` and `mimeType` for `MakerDeb`. This guide uses `electron-app` as an example.

```ts
// forge.config.ts
import type { ForgeConfig } from "@electron-forge/shared-types";

// ...
import { MakerDeb } from "@electron-forge/maker-deb";

const config: ForgeConfig = {
	packagerConfig: {
		protocols: [
			{
				name: "Electron app",
				schemes: ["electron-app"]
			}
		]
	},
	makers: [
		// ...
		new MakerDeb({
			options: {
				mimeType: ["x-scheme-handler/electron-app"]
			}
		})
	]
	// ...
};

export default config;
```

In `src/main.ts`, set the default protocol client with `App.setAsDefaultProtocolClient()`.

```ts
// src/main.ts
import { app } from "electron";
import path from "path";

if (process.defaultApp) {
	if (process.argv.length >= 2) {
		app.setAsDefaultProtocolClient("electron-app", process.execPath, [
			path.resolve(process.argv[1])
		]);
	}
} else {
	app.setAsDefaultProtocolClient("electron-app");
}
```

### Setup IPC listeners

These will be invoked from `src/preload.ts`.

```ts
// src/main.ts
import { app, BrowserWindow, shell, net } from "electron";

ipcMain.handle("auth:signInWithGithub", () => {
	shell.openExternal("http://localhost:3000/login/github");
});

ipcMain.handle("auth:getUser", async (e, sessionToken: string) => {
	const response = await net.fetch("http://localhost:3000/user", {
		headers: {
			Authorization: `Bearer ${sessionToken}`
		}
	});
	if (!response.ok) {
		return null;
	}
	return await response.json();
});

ipcMain.handle("auth:signOut", async (e, sessionToken: string) => {
	await net.fetch("http://localhost:3000/logout", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${sessionToken}`
		}
	});
});
```

### Setup login callback

Listen for the deep-link callback, parse the url, and send the token to the renderer with the `auth-state-update` event (`preload.ts`).

```ts
// src/main.ts
import { app, BrowserWindow, ipcMain, shell, net } from "electron";

// new BrowserWindow() instance
let mainWindow: BrowserWindow;

// for windows, linux
app.on("second-instance", (_, commandLine) => {
	// Someone tried to run a second instance, we should focus our window.
	if (mainWindow) {
		if (mainWindow.isMinimized()) mainWindow.restore();
		mainWindow.focus();
	}
	const url = commandLine.at(-1);
	handleDeepLinkCallback(url);
});

// macos
app.on("open-url", (_, url) => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
	handleDeepLinkCallback(url);
});

const handleDeepLinkCallback = (url: string) => {
	if (!url.startsWith("electron-app://login?")) return;
	const params = new URLSearchParams(url.replace("electron-app://login?", ""));
	const sessionToken = params.get("session_token");
	if (!sessionToken) return;
	mainWindow.webContents.send("auth-state-update", sessionToken);
};

const createWindow = () => {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, "preload.js")
		}
	});
	// ...
};
```

### Frontend

Listen for the `auth-state-update` event sent by `main.ts`, and get the user and store token as needed. While we're there are ways to store tokens in with obfuscation, security is comparable to using `localStorage` API in a browser.

```ts
// src/preload.ts
import { ipcRenderer } from "electron";

ipcRenderer.on("auth-state-update", async (e, sessionToken: string | null) => {
	if (sessionToken) {
		const user = await getUser(sessionToken);
		if (user) {
			localStorage.setItem("session_token", sessionToken);
			// signed in
		} else {
			localStorage.removeItem("session_token");
		}
	} else {
		localStorage.removeItem("session_token");
	}
});

const signInWithGithub = async () => {
	await ipcRenderer.invoke("auth:signInWithGithub");
};

const getUser = async (sessionToken: string): Promise<User | null> => {
	return await ipcRenderer.invoke("auth:getUser", sessionToken);
};

const signOut = async () => {
	const sessionToken = localStorage.getItem("session_token");
	if (!sessionToken) return;
	await ipcRenderer.invoke("auth:signOut", sessionToken);
	renderUserProfile(null);
	localStorage.removeItem("session_token");
};

type User = {
	userId: string;
	username: string;
};
```
