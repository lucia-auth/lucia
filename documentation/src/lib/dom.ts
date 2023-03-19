export const addClassName = (element: HTMLElement, ...classNames: string[]) => {
	element.className = [...element.className.split(" "), ...classNames].join(
		" "
	);
};

export const removeClassName = (
	element: HTMLElement,
	...className: string[]
) => {
	element.className = element.className
		.split(" ")
		.filter((item) => !className.includes(item))
		.join(" ");
};
