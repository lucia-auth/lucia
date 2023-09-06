export const getBuildId = (): string => {
	let buildId: string | null = null;
	if (typeof document === "undefined") {
		buildId = import.meta.env.BUILD_ID;
	} else {
		const element = document.querySelector("[property~=build_id][content]");
		if (element instanceof HTMLMetaElement) {
			buildId = element.content;
		}
	}
	if (!buildId) throw new Error("BUILD_ID undefined");
	return buildId;
};
