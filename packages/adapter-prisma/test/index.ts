import { testAdapter, databaseUser } from "@lucia-auth/adapter-test";
import { PrismaClient } from "@prisma/client";

import { PrismaAdapter } from "../src/prisma.js";

const client = new PrismaClient();
const adapter = new PrismaAdapter(client, {
	user: "User",
	session: "Session"
});

await client.user.create({
	data: {
		id: databaseUser.userId,
		...databaseUser.attributes
	}
});

await testAdapter(adapter);

await client.session.deleteMany();
await client.user.deleteMany();

process.exit(0);
