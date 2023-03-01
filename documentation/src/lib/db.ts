import { DB, type DBConfig } from "@db/query";
import { Optional$, String$ } from "@db/schema";

const config = [
	{
		id: "integration",
		schema: {
			title: String$()
		},
		docSchema: {
			title: String$()
		}
	} as const,
	{
		id: "main",
		schema: {
			title: String$()
		},
		docSchema: {
			title: String$(),
			redirect: Optional$(String$())
		}
	} as const
] satisfies DBConfig;

export const db = new DB(config);
