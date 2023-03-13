import { CollectionQuery, DB, type DBConfig } from "@db/query";
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
	} as const,
	{
		id: "shared",
		schema: {
			replace_with_framework: Optional$(String$())
		}
	} as const,
	{
		id: "framework"
	}
] satisfies DBConfig;

export const db = new DB(config);

export const resolveCollection = (
	collection: CollectionQuery<typeof db, "shared">,
	frameworkId: string
) => {
	if (collection.metaData.replace_with_framework === undefined)
		return collection;
	return db.query(
		"framework",
		frameworkId,
		...collection.metaData.replace_with_framework.split("/")
	);
};
