export const setElementVisibility = (element: HTMLElement, visible: boolean) => {
	if (visible) {
		element.classList.remove("hidden");
	} else {
		element.classList.add("hidden");
	}
};
