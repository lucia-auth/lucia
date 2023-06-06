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

export const getSetArgs = (fields: string[], placeholders: string[]) => {
	return fields
		.map((field, i) => [field, placeholders[i]].join(" = "))
		.join(",");
};
