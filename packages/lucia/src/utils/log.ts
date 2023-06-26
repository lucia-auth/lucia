export const logError = (message: string) => {
	console.log("\x1b[31m%s\x1b[31m", `[LUCIA_ERROR] ${message}`);
};
