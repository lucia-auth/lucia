export const sendForm = async (formElement: HTMLFormElement) => {
	const response = await fetch(formElement.action, {
		method: formElement.method,
		body: new FormData(formElement)
	});
	return response;
};
