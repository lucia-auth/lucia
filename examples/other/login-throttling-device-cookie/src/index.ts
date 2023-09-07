import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { setCookie, getCookie } from "hono/cookie";
import { generateRandomString } from "lucia/utils";
import fs from "fs/promises";

const app = new Hono();

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

app.get("/", async (c) => {
	const html = await fs.readFile("src/index.html");
	return c.html(html.toString());
});

app.post("/", async (c) => {
	const { username, password } = await c.req.parseBody();
	if (typeof username !== "string" || username.length < 1) {
		return c.text("Invalid username", 400);
	}
	if (password !== "invalid" && password !== "valid") {
		return c.text("Invalid request body", 400);
	}
	const storedDeviceCookieId = getCookie(c, "device_cookie") ?? null;
	const validDeviceCookie = isValidateDeviceCookie(
		storedDeviceCookieId,
		username
	);
	if (!validDeviceCookie) {
		setCookie(c, "device_cookie", "", {
			path: "/",
			secure: false, // true for production
			maxAge: 0,
			httpOnly: true
		});
		const storedTimeout = loginTimeout.get(username) ?? null;
		const timeoutUntil = storedTimeout?.timeoutUntil ?? 0;
		if (Date.now() < timeoutUntil) {
			return c.text(
				`Too many requests - wait ${Math.floor(
					(timeoutUntil - Date.now()) / 1000
				)} seconds`,
				400
			);
		}
		const timeoutSeconds = storedTimeout ? storedTimeout.timeoutSeconds * 2 : 1;
		loginTimeout.set(username, {
			timeoutUntil: Date.now() + timeoutSeconds * 1000,
			timeoutSeconds
		});
		if (password === "invalid") {
			return c.json(
				`Invalid credentials - timed out for ${timeoutSeconds} seconds`,
				400
			);
		}
		loginTimeout.delete(username);
	} else {
		if (password === "invalid") {
			return c.json(`Invalid credentials`, 400);
		}
	}
	const newDeviceCookieId = generateRandomString(40);
	deviceCookie.set(newDeviceCookieId, {
		username,
		attempts: 0
	});
	setCookie(c, "device_cookie", newDeviceCookieId, {
		path: "/",
		secure: false, // true for production
		maxAge: 60 * 60 * 24 * 365, // 1 year
		httpOnly: true
	});
	return c.text("Success - throttling reset");
});

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

serve(app);
