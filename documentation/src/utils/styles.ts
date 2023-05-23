export const dynamicClassName = (
	baseClassNames: string,
	conditionalClassNames: Record<string, boolean>
) => {
	const result = baseClassNames.split(" ");
	for (const className in conditionalClassNames) {
		if (!conditionalClassNames[className]) continue;
		result.push(className);
	}
	return result.join(" ");
};
