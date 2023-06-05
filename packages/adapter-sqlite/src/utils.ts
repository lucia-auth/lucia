import type { SessionSchema } from "lucia";

export const transformDatabaseSession = (
	session: SessionSchema
): SessionSchema => {
	return {
		...session,
		id: session.id,
		user_id: session.user_id,
		active_expires: Number(session.active_expires),
		idle_expires: Number(session.idle_expires)
	};
};

const createPreparedStatementHelper = (
	placeholder: (index: number) => string,
	escapeChar: string
) => {
	const helper = (
		values: Record<string, any>
	): readonly [fields: string[], placeholders: string[], arguments: any[]] => {
		const keys = Object.keys(values);
		return [
			keys.map((k) => escapeName(k, escapeChar)),
			keys.map((_, i) => placeholder(i)),
			keys.map((k) => values[k])
		] as const;
	};
	return helper;
};

const escapeName = (val: string, escapeChar: string) => {
	return `${escapeChar}${val}${escapeChar}`;
};

export const helper = createPreparedStatementHelper(() => "?", "`");

export const get = <Result>(result: any): Result | null => {
	if (!result) return null;
	if (Array.isArray(result)) return result.at(0) ?? null;
	return result;
};

export const getAll = <Result>(result: any): Result[] => {
	if (!result) return [];
	if (Array.isArray(result)) return result;
	return [result];
};

export const getSetArgs = (fields: string[], placeholders: string[]) => {
	return fields
		.map((field, i) => [field, placeholders[i]].join(" = "))
		.join(",");
};
