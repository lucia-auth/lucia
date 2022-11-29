import inquirer from "inquirer";
import { lineBreak } from "../log.js";

export const inputPrompt = async (message: string, defaultInput: string) => {
	return new Promise<string>((resolve) => {
		inquirer
			.prompt({
				type: "input",
				name: "input",
				default: defaultInput,
				message
			})
			.then((answer: { input: string }) => {
				lineBreak();
				resolve(answer.input);
			});
	});
};
