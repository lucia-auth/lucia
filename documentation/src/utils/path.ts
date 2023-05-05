export const joinUrlPaths = (base: string, ...paths: string[]) => {
	return new URL(
		[base, ...paths]
			.join("/")
			.split("/")
			.filter((val) => !!val)
			.join("/")
	);
};
