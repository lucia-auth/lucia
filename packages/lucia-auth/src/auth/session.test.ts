import { expect, test } from "vitest";
import { validateDatabaseSession } from "./session.js";

test("validateDatabaseSession() returns null if dead state", async () => {
	const output = validateDatabaseSession({
		id: "",
		idle_expires: new Date().getTime() - 10 * 1000,
		active_expires: new Date().getTime(),
		user_id: ""
	});
	expect(output).toBeNull();
});

test("validateDatabaseSession() returns idle session if idle state", async () => {
	const output = validateDatabaseSession({
		id: "",
		idle_expires: new Date().getTime() + 10 * 1000,
		active_expires: new Date().getTime() - 10 * 1000,
		user_id: ""
	});
	expect(output?.state).toBe("idle");
});

test("validateDatabaseSession() returns active session if active state", async () => {
	const output = validateDatabaseSession({
		id: "",
		idle_expires: new Date().getTime() + 10 * 1000,
		active_expires: new Date().getTime() + 10 * 1000,
		user_id: ""
	});
	expect(output?.state).toBe("active");
});
