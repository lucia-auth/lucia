import { serve } from "@hono/node-server";
import { Hono } from "hono";

import fs from "fs/promises";

const app = new Hono();

const usernameThrottling = new Map<
	string,
	{
		timeoutUntil: number;
		timeoutSeconds: number;
	}
>();

app.get("/", async (c) => {
	const html = await fs.readFile("src/pages/index.html");
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
	const storedThrottling = usernameThrottling.get(username);
	const timeoutUntil = storedThrottling?.timeoutUntil ?? 0;
	if (Date.now() < timeoutUntil) {
		return c.text(
			`Too many requests - wait ${Math.floor(
				(timeoutUntil - Date.now()) / 1000
			)} seconds`,
			400
		);
	}
	if (password === "invalid") {
		const timeoutSeconds = storedThrottling
			? storedThrottling.timeoutSeconds * 2
			: 1;
		usernameThrottling.set(username, {
			timeoutUntil: Date.now() + timeoutSeconds * 1000,
			timeoutSeconds
		});
		return c.json(
			`Invalid credentials - timed out for ${timeoutSeconds} seconds`,
			400
		);
	}
	usernameThrottling.delete(username);
	return c.text("Success - throttling reset");
});

serve(app);
