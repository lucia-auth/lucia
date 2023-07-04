import { test } from "vitest";
import { debug, enableDebugMode } from "./debug.js";

test("log format", async () => {
	enableDebugMode();
	debug.request.init("get", "http://localhost:3000");
	debug.request.info("Incoming session cookie", "123456");
	debug.request.notice("Skipping CSRF check");
	debug.session.success("Validated session", "123456");
	debug.session.fail("Failed to validate session", "123456");
	debug.key.success("Validated password", "123456");
	debug.key.fail("Failed to validate password", "123456");
});
