export const setCookie = (name: string, value: string) => {
	document.cookie = `${name}=${value};max-age=${60 * 60 * 24 * 365};path=/;`;
};
