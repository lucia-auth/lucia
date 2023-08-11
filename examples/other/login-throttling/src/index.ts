import { serve } from "@hono/node-server";
import { Hono } from "hono";
import fs from "fs/promises";

const app = new Hono();

const loginTimeout = new Map<
	string,
	{
		timeoutUntil: number;
		timeoutSeconds: number;
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
	const storedTimeout = loginTimeout.get(username);
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
	return c.text("Success - throttling reset");
});

serve(app);
