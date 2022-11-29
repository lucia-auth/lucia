import inquirer from "inquirer";
import { lineBreak } from "../log.js";

export const confirmPrompt = async (message: string) => {
	return new Promise<boolean>((resolve) => {
		inquirer
			.prompt({
				type: "confirm",
				name: "confirmation",
				message
			})
			.then((answer: { confirmation: boolean }) => {
				lineBreak();
				resolve(answer.confirmation);
			});
	});
};
