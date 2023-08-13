export const comparePathname = (path1: string, path2: string) => {
	return path1 === path2 || path1 === path2 + "/" || path1 + "/" === path2;
};
