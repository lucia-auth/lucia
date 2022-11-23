import inquirer from "inquirer";

export const confirmPrompt = async (message: string) => {
	return new Promise<boolean>((resolve) => {
		inquirer
			.prompt({
				type: "confirm",
				name: "confirmation",
				message
			})
			.then((answer: { confirmation: boolean }) => resolve(answer.confirmation));
	});
};
