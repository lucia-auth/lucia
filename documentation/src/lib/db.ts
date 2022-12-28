import { DB } from "@db/query";
import { Optional$, String$ } from "@db/schema";
import type { CollectionConfig, Query } from "@db/types";

const config = [
	{
		id: ["integration"] as const,
		_: {
			id: ["nextjs", "sveltekit", "oauth"] as const,
			schema: {
				title: String$()
			},
			_: {
				id: "*" as const,
				schema: {
					title: String$()
				},
				docSchema: {
					title: String$()
				}
			}
		}
	} satisfies CollectionConfig,
	{
		id: ["main"] as const,
		_: {
			id: ["learn", "reference"] as const,
			schema: {
				title: String$()
			},
			_: {
				id: "*" as const,
				schema: {
					title: String$()
				},
				docSchema: {
					title: String$(),
					redirect: Optional$(String$())
				}
			}
		}
	} satisfies CollectionConfig
] as const;

export const db = new DB(config);
export type Q = Query<typeof config>