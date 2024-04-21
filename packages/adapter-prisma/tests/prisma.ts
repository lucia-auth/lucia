import { testAdapter, databaseUser } from "@lucia-auth/adapter-test";
import { PrismaClient } from "@prisma/client";

import { PrismaAdapter } from "../src/index.js";

const client = new PrismaClient();

const adapter = new PrismaAdapter(client.session, client.user, {
	settings: true
});

await client.user.create({
	data: {
		id: databaseUser.id,
		...databaseUser.attributes,
		settings: {
			create: {
				theme: "test"
			}
		}
	}
});

await testAdapter(adapter, {
	...databaseUser,
	attributes: {
		...databaseUser.attributes,
		settings: {
			userId: databaseUser.id,
			theme: "test"
		}
	}
});

await client.session.deleteMany();
await client.user.deleteMany();

process.exit(0);

declare module "lucia" {
	interface Register {
		DatabaseUserAttributes: {
			username: string;
			settings?: {
				userId: string;
				theme: string;
			};
		};
	}
}
