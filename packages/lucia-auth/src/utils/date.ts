export const getTimeAfterSeconds = (seconds: number) => {
	return new Date().getTime() + 1000 * seconds;
};

export const isWithinExpiration = (millisecond: number | bigint | null) => {
	if (millisecond === null) return false;
	const currentTime = Date.now();
	if (currentTime > millisecond) return false;
	return true;
};
