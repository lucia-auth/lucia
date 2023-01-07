export const signOut = async (url: string) => {
	const response = await fetch(url, {
		method: "POST"
	});
	if (!response.ok) throw new Error("unknown error");
};
