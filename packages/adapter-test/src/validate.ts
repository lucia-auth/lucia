import type { ErrorMessage } from "lucia-auth/auth/error";

export const isNull = (data: any) => {
	if (data === null) return;
	typeError(data, "null");
};
export const isEmptyArray = (data: unknown) => {
	if (Array.isArray(data) && data.length === 0) return;
	typeError(data, "array");
};

export const compareErrorMessage = async (
	test: () => Promise<void> | void,
	expectedValue: ErrorMessage
) => {
	try {
		await test();
		throw new Error("No error was thrown");
	} catch (e) {
		if (typeof e !== "object" || e === null) throw typeError(e, "object");
		if ("message" in e && e.message === expectedValue) return;
		throw valueError(
			"message" in e ? e.message : undefined,
			expectedValue,
			"Error message did not match"
		);
	}
};

export const typeError = (received: any, expected: string) => {
	logErrorResult(received, `type ${expected}`);
	return new Error("Target was not of expected type");
};

export const valueError = (
	received: any,
	expected: any,
	errorMessage: string
) => {
	logErrorResult(received, expected);
	return new Error(errorMessage);
};

const logErrorResult = (received: any, expected: any) => {
	console.log("received: ");
	console.dir(received, { depth: null });
	console.log("expected: ");
	console.dir(expected, { depth: null });
};
