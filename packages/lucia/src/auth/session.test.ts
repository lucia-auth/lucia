import { expect, test } from "vitest";
import { isValidDatabaseSession } from "./session.js";

test("isValidDatabaseSession() returns false if dead state", async () => {
	const output = isValidDatabaseSession({
		id: "",
		idle_expires: new Date().getTime() - 10 * 1000,
		active_expires: new Date().getTime(),
		user_id: ""
	});
	expect(output).toBe(false);
});
