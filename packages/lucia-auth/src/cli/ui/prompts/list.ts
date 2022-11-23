import inquirer from "inquirer";

type AllowedTypes = string | number | null;

export const listPrompt = async <M extends string, Choices extends [AllowedTypes, string][]>(
	message: M,
	choices: Choices
) => {
	return new Promise<Choices[number][0]>((resolve) => {
		inquirer
			.prompt({
				type: "list",
				name: "selected",
				message,
				choices: choices.map((val) => val[1])
			})
			.then(({ selected }: { selected: Choices[number][1] }) => {
				const entry = choices.find((val) => val[1] === selected)!;
				resolve(entry[0]);
			});
	});
};
