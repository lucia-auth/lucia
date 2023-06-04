export const getTimeAfterSeconds = (seconds: number) => {
	return new Date().getTime() + 1000 * seconds;
};

export const isWithinExpiration = (expiresInMs: number | bigint) => {
	const currentTime = Date.now();
	if (currentTime > expiresInMs) return false;
	return true;
};
