export const setTheme = (darkmode: boolean) => {
	localStorage.setItem("darkmode", darkmode.toString());
	if (darkmode) document.documentElement.classList.add("dark");
	else document.documentElement.classList.remove("dark");
};

export const getTheme = () =>
	(localStorage.getItem("darkmode") ??
		window.matchMedia("(prefers-color-scheme: dark)").matches.toString()) ===
	"true";
