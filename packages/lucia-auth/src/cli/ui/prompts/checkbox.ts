import inquirer from "inquirer";
import { lineBreak } from "../log.js";

type AllowedTypes = string | number | null;

export const checkboxPrompt = async <M extends string, Choices extends [AllowedTypes, string][]>(
	message: M,
	choices: Choices
) => {
	return new Promise<Choices[number][0][]>((resolve) => {
		inquirer
			.prompt({
				type: "checkbox",
				name: "checked",
				message,
				choices: choices.map((val) => val[1])
			})
			.then(({ checked }: { checked: Choices[number][1][] }) => {
				lineBreak();
				const entry = checked.map(
					(checkedMessage) => choices.find((val) => val[1] === checkedMessage)![0]
				);
				resolve(entry);
			});
	});
};
