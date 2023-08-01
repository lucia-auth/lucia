export const getTimeAfterSeconds = (seconds: number): number => {
	return new Date().getTime() + 1000 * seconds;
};

export const isWithinExpiration = (expiresInMs: number | bigint): boolean => {
	const currentTime = Date.now();
	if (currentTime > expiresInMs) return false;
	return true;
};
